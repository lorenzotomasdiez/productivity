//
//  GoalViewModel.swift
//  Jarvis
//
//  Created by Lorenzo Tomas Diez on 04/08/2025.
//

import Foundation
import CoreData
import SwiftUI

class GoalViewModel: ObservableObject {
    @Published var goals: [Goal] = []
    @Published var filteredGoals: [Goal] = []
    @Published var isLoading = false
    @Published var errorMessage: String?
    @Published var selectedLifeAreaFilter: LifeArea?
    @Published var selectedGoalTypeFilter: String?
    
    private let viewContext: NSManagedObjectContext
    
    init(context: NSManagedObjectContext) {
        self.viewContext = context
        fetchGoals()
    }
    
    // MARK: - CRUD Operations
    
    func fetchGoals() {
        isLoading = true
        errorMessage = nil
        
        let request: NSFetchRequest<Goal> = Goal.fetchRequest()
        request.sortDescriptors = [NSSortDescriptor(keyPath: \Goal.createdAt, ascending: false)]
        
        do {
            goals = try viewContext.fetch(request)
            applyFilters()
        } catch {
            errorMessage = "Failed to fetch goals: \(error.localizedDescription)"
        }
        
        isLoading = false
    }
    
    func createGoal(title: String, description: String?, goalType: String, targetValue: Double?, targetUnit: String?, lifeArea: LifeArea?) {
        let newGoal = Goal(context: viewContext)
        newGoal.id = UUID()
        newGoal.title = title
        newGoal.goalDescription = description
        newGoal.goalType = goalType
        newGoal.targetValue = targetValue ?? 0.0
        newGoal.targetUnit = targetUnit
        newGoal.lifeArea = lifeArea
        newGoal.createdAt = Date()
        newGoal.updatedAt = Date()
        
        saveContext()
    }
    
    func updateGoal(_ goal: Goal, title: String, description: String?, goalType: String, targetValue: Double?, targetUnit: String?, lifeArea: LifeArea?) {
        goal.title = title
        goal.goalDescription = description
        goal.goalType = goalType
        goal.targetValue = targetValue ?? 0.0
        goal.targetUnit = targetUnit
        goal.lifeArea = lifeArea
        goal.updatedAt = Date()
        
        saveContext()
    }
    
    func deleteGoal(_ goal: Goal) {
        viewContext.delete(goal)
        saveContext()
    }
    
    // MARK: - Filtering
    
    func applyFilters() {
        var filtered = goals
        
        if let lifeAreaFilter = selectedLifeAreaFilter {
            filtered = filtered.filter { $0.lifeArea?.id == lifeAreaFilter.id }
        }
        
        if let goalTypeFilter = selectedGoalTypeFilter {
            filtered = filtered.filter { $0.goalType == goalTypeFilter }
        }
        
        filteredGoals = filtered
    }
    
    func setLifeAreaFilter(_ lifeArea: LifeArea?) {
        selectedLifeAreaFilter = lifeArea
        applyFilters()
    }
    
    func setGoalTypeFilter(_ goalType: String?) {
        selectedGoalTypeFilter = goalType
        applyFilters()
    }
    
    func clearFilters() {
        selectedLifeAreaFilter = nil
        selectedGoalTypeFilter = nil
        applyFilters()
    }
    
    // MARK: - Progress Calculation
    
    func calculateProgress(for goal: Goal) -> Double {
        guard let progressEntries = goal.progressEntries?.allObjects as? [ProgressEntry],
              !progressEntries.isEmpty else {
            return 0.0
        }
        
        let totalValue = progressEntries.reduce(0.0) { $0 + $1.value }
        
        if goal.targetValue > 0 {
            return min(totalValue / goal.targetValue, 1.0)
        }
        
        return 0.0
    }
    
    func getRecentProgress(for goal: Goal, days: Int = 7) -> [ProgressEntry] {
        guard let progressEntries = goal.progressEntries?.allObjects as? [ProgressEntry] else {
            return []
        }
        
        let cutoffDate = Calendar.current.date(byAdding: .day, value: -days, to: Date()) ?? Date()
        return progressEntries.filter { 
            guard let entryDate = $0.date else { return false }
            return entryDate >= cutoffDate 
        }
        .sorted { 
            guard let date1 = $0.date, let date2 = $1.date else { return false }
            return date1 > date2 
        }
    }
    
    // MARK: - Helper Methods
    
    private func saveContext() {
        do {
            try viewContext.save()
            fetchGoals() // Refresh the list
        } catch {
            errorMessage = "Failed to save changes: \(error.localizedDescription)"
        }
    }
    
    func clearError() {
        errorMessage = nil
    }
    
    // MARK: - Validation
    
    func validateGoal(title: String, goalType: String, targetValue: Double?) -> Bool {
        guard !title.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else {
            errorMessage = "Goal title cannot be empty"
            return false
        }
        
        guard !goalType.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else {
            errorMessage = "Goal type cannot be empty"
            return false
        }
        
        if let targetValue = targetValue, targetValue < 0 {
            errorMessage = "Target value cannot be negative"
            return false
        }
        
        return true
    }
}
