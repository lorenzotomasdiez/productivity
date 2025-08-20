//
//  DashboardViewModelTests.swift
//  JarvisTests
//
//  Created by Lorenzo Tomas Diez on 04/08/2025.
//

import XCTest
import CoreData
import SwiftUI
@testable import Jarvis

@MainActor
final class DashboardViewModelTests: XCTestCase {
    var viewModel: DashboardViewModel!
    var context: NSManagedObjectContext!
    var container: NSPersistentContainer!
    var lifeAreaViewModel: LifeAreaViewModel!
    var goalViewModel: GoalViewModel!
    var progressViewModel: ProgressViewModel!
    
    override func setUpWithError() throws {
        // Create in-memory Core Data stack for testing
        container = NSPersistentContainer(name: "Jarvis")
        let description = NSPersistentStoreDescription()
        description.url = URL(fileURLWithPath: "/dev/null")
        container.persistentStoreDescriptions = [description]
        
        container.loadPersistentStores { _, error in
            if let error = error {
                fatalError("Failed to load test store: \(error)")
            }
        }
        
        context = container.viewContext
        
        // Create view models
        lifeAreaViewModel = LifeAreaViewModel(context: context)
        goalViewModel = GoalViewModel(context: context)
        progressViewModel = ProgressViewModel(context: context)
        
        viewModel = DashboardViewModel(
            context: context,
            lifeAreaViewModel: lifeAreaViewModel,
            goalViewModel: goalViewModel,
            progressViewModel: progressViewModel
        )
    }
    
    override func tearDownWithError() throws {
        // Clear all data from the context
        let entities = container.managedObjectModel.entities
        for entity in entities {
            let fetchRequest = NSFetchRequest<NSFetchRequestResult>(entityName: entity.name!)
            let deleteRequest = NSBatchDeleteRequest(fetchRequest: fetchRequest)
            try context.execute(deleteRequest)
        }
        
        // Save the context to persist the deletions
        try context.save()
        
        viewModel = nil
        lifeAreaViewModel = nil
        goalViewModel = nil
        progressViewModel = nil
        context = nil
        container = nil
    }
    
    // MARK: - Dashboard Stats Tests
    
    func testDashboardStatsWithNoData() throws {
        // Given - No data created
        
        // When
        viewModel.refreshDashboard()
        
        // Then
        XCTAssertEqual(viewModel.dashboardStats.activeGoalsCount, 0)
        XCTAssertEqual(viewModel.dashboardStats.lifeAreasCount, 0)
        XCTAssertEqual(viewModel.dashboardStats.todayProgressPercentage, 0)
        XCTAssertEqual(viewModel.dashboardStats.totalGoalsCount, 0)
    }
    
    func testDashboardStatsWithLifeAreas() throws {
        // Given
        lifeAreaViewModel.createLifeArea(name: "Health", icon: "heart.fill", colorHex: "#FF0000", description: nil)
        lifeAreaViewModel.createLifeArea(name: "Finance", icon: "dollarsign.circle.fill", colorHex: "#00FF00", description: nil)
        
        // When
        viewModel.refreshDashboard()
        
        // Then
        XCTAssertEqual(viewModel.dashboardStats.lifeAreasCount, 2)
    }
    
    func testDashboardStatsWithGoals() throws {
        // Given
        lifeAreaViewModel.createLifeArea(name: "Health", icon: "heart.fill", colorHex: "#FF0000", description: nil)
        let lifeArea = lifeAreaViewModel.lifeAreas.first!
        goalViewModel.createGoal(title: "Exercise", description: nil, goalType: "Habit", targetValue: nil, targetUnit: nil, lifeArea: lifeArea)
        goalViewModel.createGoal(title: "Read Books", description: nil, goalType: "Numeric", targetValue: 20.0, targetUnit: "books", lifeArea: lifeArea)
        
        // When
        viewModel.refreshDashboard()
        
        // Then
        XCTAssertEqual(viewModel.dashboardStats.totalGoalsCount, 2)
        XCTAssertEqual(viewModel.dashboardStats.activeGoalsCount, 2) // Newly created goals are considered active
    }
    
    func testDashboardStatsWithProgress() throws {
        // Given
        lifeAreaViewModel.createLifeArea(name: "Health", icon: "heart.fill", colorHex: "#FF0000", description: nil)
        let lifeArea = lifeAreaViewModel.lifeAreas.first!
        goalViewModel.createGoal(title: "Exercise", description: nil, goalType: "Habit", targetValue: 30.0, targetUnit: "minutes", lifeArea: lifeArea)
        
        let goal = goalViewModel.goals.first!
        let today = Date()
        progressViewModel.createProgressEntry(value: 25.0, notes: "Great workout", date: today, goal: goal)
        
        // When
        viewModel.refreshDashboard()
        
        // Then
        XCTAssertEqual(viewModel.dashboardStats.totalGoalsCount, 1)
        XCTAssertEqual(viewModel.dashboardStats.activeGoalsCount, 1)
        XCTAssertEqual(viewModel.dashboardStats.todayProgressPercentage, 83) // (25/30) * 100 ≈ 83
    }
    
    func testDashboardStatsWithMultipleGoalsAndProgress() throws {
        // Given
        lifeAreaViewModel.createLifeArea(name: "Health", icon: "heart.fill", colorHex: "#FF0000", description: nil)
        let lifeArea = lifeAreaViewModel.lifeAreas.first!
        
        // Goal 1: Exercise 30 minutes
        goalViewModel.createGoal(title: "Exercise", description: nil, goalType: "Habit", targetValue: 30.0, targetUnit: "minutes", lifeArea: lifeArea)
        let exerciseGoal = goalViewModel.goals.first!
        
        // Goal 2: Read 20 books
        goalViewModel.createGoal(title: "Read Books", description: nil, goalType: "Numeric", targetValue: 20.0, targetUnit: "books", lifeArea: lifeArea)
        let readingGoal = goalViewModel.goals.last!
        
        // Add progress for both goals today
        let today = Date()
        progressViewModel.createProgressEntry(value: 25.0, notes: "Workout", date: today, goal: exerciseGoal)
        progressViewModel.createProgressEntry(value: 5.0, notes: "Reading", date: today, goal: readingGoal)
        
        // When
        viewModel.refreshDashboard()
        
        // Then
        XCTAssertEqual(viewModel.dashboardStats.totalGoalsCount, 2)
        XCTAssertEqual(viewModel.dashboardStats.activeGoalsCount, 2)
        // Total progress: (25 + 5) / (30 + 20) = 30/50 = 0.6 * 100 = 60%
        XCTAssertEqual(viewModel.dashboardStats.todayProgressPercentage, 60)
    }
    
    // MARK: - Recent Activity Tests
    
    func testRecentActivityWithNoData() throws {
        // Given - No data created
        
        // When
        viewModel.refreshDashboard()
        
        // Then
        XCTAssertEqual(viewModel.recentActivity.count, 0)
    }
    
    func testRecentActivityWithProgressEntries() throws {
        // Given
        lifeAreaViewModel.createLifeArea(name: "Health", icon: "heart.fill", colorHex: "#FF0000", description: nil)
        let lifeArea = lifeAreaViewModel.lifeAreas.first!
        goalViewModel.createGoal(title: "Exercise", description: nil, goalType: "Habit", targetValue: nil, targetUnit: nil, lifeArea: lifeArea)
        
        let goal = goalViewModel.goals.first!
        let today = Date()
        let yesterday = Calendar.current.date(byAdding: .day, value: -1, to: today)!
        
        progressViewModel.createProgressEntry(value: 30.0, notes: "Today's workout", date: today, goal: goal)
        progressViewModel.createProgressEntry(value: 25.0, notes: "Yesterday's workout", date: yesterday, goal: goal)
        
        // When
        viewModel.refreshDashboard()
        
        // Then
        // Dashboard should show: 1 life area + 1 goal + 2 progress entries = 4 total
        XCTAssertEqual(viewModel.recentActivity.count, 4)
        
        // Progress entries should be first (most recent)
        let progressActivities = viewModel.recentActivity.filter { $0.type == .progress }
        XCTAssertEqual(progressActivities.count, 2)
        
        let firstActivity = viewModel.recentActivity.first!
        XCTAssertEqual(firstActivity.title, "Progress: Exercise")
        XCTAssertEqual(firstActivity.subtitle, "30.0 units")
        XCTAssertEqual(firstActivity.type, .progress)
        XCTAssertEqual(firstActivity.icon, "chart.line.uptrend.xyaxis")
        XCTAssertEqual(firstActivity.color, .blue)
    }
    
    func testRecentActivityWithGoals() throws {
        // Given
        lifeAreaViewModel.createLifeArea(name: "Health", icon: "heart.fill", colorHex: "#FF0000", description: nil)
        let lifeArea = lifeAreaViewModel.lifeAreas.first!
        goalViewModel.createGoal(title: "Exercise", description: nil, goalType: "Habit", targetValue: nil, targetUnit: nil, lifeArea: lifeArea)
        goalViewModel.createGoal(title: "Read Books", description: nil, goalType: "Numeric", targetValue: 20.0, targetUnit: nil, lifeArea: lifeArea)
        
        // When
        viewModel.refreshDashboard()
        
        // Then
        // Dashboard should show: 1 life area + 2 goals = 3 total
        XCTAssertEqual(viewModel.recentActivity.count, 3)
        
        // Goals should be present
        let goalActivities = viewModel.recentActivity.filter { $0.type == .goal }
        XCTAssertEqual(goalActivities.count, 2)
        
        let exerciseActivity = viewModel.recentActivity.first { $0.title.contains("Exercise") }
        XCTAssertNotNil(exerciseActivity)
        XCTAssertEqual(exerciseActivity?.type, .goal)
        XCTAssertEqual(exerciseActivity?.icon, "target")
        XCTAssertEqual(exerciseActivity?.color, .green)
        
        let readingActivity = viewModel.recentActivity.first { $0.title.contains("Read Books") }
        XCTAssertNotNil(readingActivity)
        XCTAssertEqual(readingActivity?.subtitle, "Numeric")
    }
    
    func testRecentActivityWithLifeAreas() throws {
        // Given
        lifeAreaViewModel.createLifeArea(name: "Health", icon: "heart.fill", colorHex: "#FF0000", description: "Physical well-being")
        lifeAreaViewModel.createLifeArea(name: "Finance", icon: "dollarsign.circle.fill", colorHex: "#00FF00", description: "Financial goals")
        
        // When
        viewModel.refreshDashboard()
        
        // Then
        XCTAssertEqual(viewModel.recentActivity.count, 2)
        
        let healthActivity = viewModel.recentActivity.first { $0.title.contains("Health") }
        XCTAssertNotNil(healthActivity)
        XCTAssertEqual(healthActivity?.type, .lifeArea)
        XCTAssertEqual(healthActivity?.icon, "square.grid.3x3.fill")
        XCTAssertEqual(healthActivity?.color, .orange)
        XCTAssertEqual(healthActivity?.subtitle, "Physical well-being")
    }
    
    func testRecentActivityOrdering() throws {
        // Given
        lifeAreaViewModel.createLifeArea(name: "Health", icon: "heart.fill", colorHex: "#FF0000", description: nil)
        let lifeArea = lifeAreaViewModel.lifeAreas.first!
        
        // Create goal
        goalViewModel.createGoal(title: "Exercise", description: nil, goalType: "Habit", targetValue: nil, targetUnit: nil, lifeArea: lifeArea)
        let goal = goalViewModel.goals.first!
        
        // Create progress entry
        let today = Date()
        progressViewModel.createProgressEntry(value: 30.0, notes: "Workout", date: today, goal: goal)
        
        // When
        viewModel.refreshDashboard()
        
        // Then
        // Dashboard should show: 1 life area + 1 goal + 1 progress = 3 total
        XCTAssertEqual(viewModel.recentActivity.count, 3)
        
        // Progress entry should come first (most recent)
        let firstActivity = viewModel.recentActivity.first!
        XCTAssertEqual(firstActivity.type, .progress)
        
        // Goal creation should come second
        let secondActivity = viewModel.recentActivity[1]
        XCTAssertEqual(secondActivity.type, .goal)
        
        // Life area should come last (oldest)
        let thirdActivity = viewModel.recentActivity.last!
        XCTAssertEqual(thirdActivity.type, .lifeArea)
    }
    
    func testRecentActivityLimit() throws {
        // Given - Create more than 10 activities
        lifeAreaViewModel.createLifeArea(name: "Health", icon: "heart.fill", colorHex: "#FF0000", description: nil)
        let lifeArea = lifeAreaViewModel.lifeAreas.first!
        
        // Create 15 goals
        for i in 1...15 {
            goalViewModel.createGoal(title: "Goal \(i)", description: nil, goalType: "Habit", targetValue: nil, targetUnit: nil, lifeArea: lifeArea)
        }
        
        // When
        viewModel.refreshDashboard()
        
        // Then
        // Dashboard should show: 1 life area + 15 goals = 16 total, but limited to 10
        XCTAssertEqual(viewModel.recentActivity.count, 10) // Should be limited to 10
    }
    
    // MARK: - Error Handling Tests
    
    func testClearError() throws {
        // Given
        viewModel.errorMessage = "Test error message"
        
        // When
        viewModel.clearError()
        
        // Then
        XCTAssertNil(viewModel.errorMessage)
    }
    
    // MARK: - Loading State Tests
    
    func testLoadingStateDuringRefresh() throws {
        // Given
        viewModel.isLoading = false
        
        // When
        viewModel.refreshDashboard()
        
        // Then
        XCTAssertFalse(viewModel.isLoading) // Should be false after refresh completes
    }
    
    // MARK: - Data Model Tests
    
    func testDashboardStatsInitialization() throws {
        // Given & When
        let stats = DashboardStats()
        
        // Then
        XCTAssertEqual(stats.activeGoalsCount, 0)
        XCTAssertEqual(stats.lifeAreasCount, 0)
        XCTAssertEqual(stats.todayProgressPercentage, 0)
        XCTAssertEqual(stats.totalGoalsCount, 0)
    }
    
    func testRecentActivityItemInitialization() throws {
        // Given
        let id = "test-id"
        let title = "Test Activity"
        let subtitle = "Test Subtitle"
        let date = Date()
        let type = RecentActivityItem.ActivityType.progress
        let icon = "test.icon"
        let color = Color.red
        
        // When
        let activity = RecentActivityItem(
            id: id,
            title: title,
            subtitle: subtitle,
            date: date,
            type: type,
            icon: icon,
            color: color
        )
        
        // Then
        XCTAssertEqual(activity.id, id)
        XCTAssertEqual(activity.title, title)
        XCTAssertEqual(activity.subtitle, subtitle)
        XCTAssertEqual(activity.date, date)
        XCTAssertEqual(activity.type, type)
        XCTAssertEqual(activity.icon, icon)
        XCTAssertEqual(activity.color, color)
    }
    
    func testActivityTypeCases() throws {
        // Given & When & Then
        XCTAssertEqual(RecentActivityItem.ActivityType.progress, .progress)
        XCTAssertEqual(RecentActivityItem.ActivityType.goal, .goal)
        XCTAssertEqual(RecentActivityItem.ActivityType.lifeArea, .lifeArea)
    }
}
