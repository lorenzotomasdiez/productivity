//
//  DashboardViewModel.swift
//  Jarvis
//
//  Created by Lorenzo Tomas Diez on 04/08/2025.
//

import Foundation
import CoreData
import SwiftUI
import Combine

@MainActor
class DashboardViewModel: ObservableObject {
    @Published var dashboardStats = DashboardStats()
    @Published var recentActivity: [RecentActivityItem] = []
    @Published var isLoading = false
    @Published var errorMessage: String?
    
    private let viewContext: NSManagedObjectContext
    private let lifeAreaViewModel: LifeAreaViewModel
    private let goalViewModel: GoalViewModel
    private let progressViewModel: ProgressViewModel
    
    init(context: NSManagedObjectContext, 
         lifeAreaViewModel: LifeAreaViewModel,
         goalViewModel: GoalViewModel,
         progressViewModel: ProgressViewModel) {
        self.viewContext = context
        self.lifeAreaViewModel = lifeAreaViewModel
        self.goalViewModel = goalViewModel
        self.progressViewModel = progressViewModel
        
        // Observe changes in other view models
        lifeAreaViewModel.objectWillChange.sink { [weak self] in
            self?.refreshDashboard()
        }.store(in: &cancellables)
        
        goalViewModel.objectWillChange.sink { [weak self] in
            self?.refreshDashboard()
        }.store(in: &cancellables)
        
        progressViewModel.objectWillChange.sink { [weak self] in
            self?.refreshDashboard()
        }.store(in: &cancellables)
        
        refreshDashboard()
    }
    
    private var cancellables = Set<AnyCancellable>()
    
    // MARK: - Dashboard Data
    
    func refreshDashboard() {
        isLoading = true
        errorMessage = nil
        
        calculateDashboardStats()
        fetchRecentActivity()
        
        isLoading = false
    }
    
    private func calculateDashboardStats() {
        let lifeAreas = lifeAreaViewModel.lifeAreas
        let goals = goalViewModel.goals
        let progressEntries = progressViewModel.progressEntries
        
        // Calculate active goals (goals with recent progress or created recently)
        let activeGoals = goals.filter { goal in
            let recentProgress = progressViewModel.getProgressEntries(for: goal, in: .week)
            let isRecentlyCreated = Calendar.current.dateComponents([.day], from: goal.createdAt ?? Date(), to: Date()).day ?? 0 <= 30
            return !recentProgress.isEmpty || isRecentlyCreated
        }
        
        // Calculate today's progress percentage based on target values
        let calendar = Calendar.current
        let today = Date()
        let todayProgress = progressEntries.filter { 
            guard let entryDate = $0.date else { return false }
            return calendar.isDate(entryDate, inSameDayAs: today)
        }
        
        let totalProgressValue = todayProgress.reduce(0.0) { $0 + $1.value }
        
        // Calculate total target values for goals with targets
        let totalTargetValue = goals.reduce(0.0) { total, goal in
            let targetValue = goal.targetValue
            if targetValue > 0 {
                return total + targetValue
            }
            return total
        }
        
        // Calculate progress percentage based on actual target values
        let progressPercentage: Double
        if totalTargetValue > 0 {
            progressPercentage = (totalProgressValue / totalTargetValue) * 100
        } else if !goals.isEmpty {
            // If no targets but we have goals, use a simple average
            progressPercentage = (totalProgressValue / Double(goals.count)) * 100
        } else {
            progressPercentage = 0
        }
        
        dashboardStats = DashboardStats(
            activeGoalsCount: activeGoals.count,
            lifeAreasCount: lifeAreas.count,
            todayProgressPercentage: Int(min(progressPercentage, 100)),
            totalGoalsCount: goals.count
        )
    }
    
    private func fetchRecentActivity() {
        var activities: [RecentActivityItem] = []
        
        // Add all progress entries
        for entry in progressViewModel.progressEntries {
            if let goal = entry.goal {
                activities.append(RecentActivityItem(
                    id: entry.id?.uuidString ?? UUID().uuidString,
                    title: "Progress: \(goal.title ?? "Unknown Goal")",
                    subtitle: "\(entry.value) \(goal.targetUnit ?? "units")",
                    date: entry.date ?? Date(),
                    type: .progress,
                    icon: "chart.line.uptrend.xyaxis",
                    color: .blue
                ))
            }
        }
        
        // Add all goals
        for goal in goalViewModel.goals {
            activities.append(RecentActivityItem(
                id: goal.id?.uuidString ?? UUID().uuidString,
                title: "New Goal: \(goal.title ?? "Unknown Goal")",
                subtitle: goal.goalType ?? "Unknown",
                date: goal.createdAt ?? Date(),
                type: .goal,
                icon: "target",
                color: .green
            ))
        }
        
        // Add all life areas
        for area in lifeAreaViewModel.lifeAreas {
            activities.append(RecentActivityItem(
                id: area.id?.uuidString ?? UUID().uuidString,
                title: "New Life Area: \(area.name ?? "Unknown Area")",
                subtitle: area.areaDescription ?? "",
                date: area.createdAt ?? Date(),
                type: .lifeArea,
                icon: "square.grid.3x3.fill",
                color: .orange
            ))
        }
        
        // Sort by date and take the most recent 10
        recentActivity = activities
            .sorted { $0.date > $1.date }
            .prefix(10)
            .map { $0 }
    }
    
    // MARK: - Helper Methods
    
    func clearError() {
        errorMessage = nil
    }
}

// MARK: - Data Models

struct DashboardStats {
    var activeGoalsCount: Int = 0
    var lifeAreasCount: Int = 0
    var todayProgressPercentage: Int = 0
    var totalGoalsCount: Int = 0
}

struct RecentActivityItem: Identifiable {
    let id: String
    let title: String
    let subtitle: String
    let date: Date
    let type: ActivityType
    let icon: String
    let color: Color
    
    enum ActivityType {
        case progress
        case goal
        case lifeArea
    }
}
