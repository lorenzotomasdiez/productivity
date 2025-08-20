//
//  GoalViewModelTests.swift
//  JarvisTests
//
//  Created by Lorenzo Tomas Diez on 04/08/2025.
//

import XCTest
import CoreData
import SwiftUI
@testable import Jarvis

@MainActor
final class GoalViewModelTests: XCTestCase {
    var viewModel: GoalViewModel!
    var context: NSManagedObjectContext!
    var container: NSPersistentContainer!
    var lifeArea: LifeArea!
    
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
        
        // Create a test life area
        lifeArea = LifeArea(context: context)
        lifeArea.id = UUID()
        lifeArea.name = "Test Life Area"
        lifeArea.icon = "star.fill"
        lifeArea.colorHex = "#FF0000"
        lifeArea.areaDescription = "Test description"
        lifeArea.createdAt = Date()
        lifeArea.updatedAt = Date()
        
        try context.save()
        
        viewModel = GoalViewModel(context: context)
    }
    
    override func tearDownWithError() throws {
        viewModel = nil
        context = nil
        container = nil
        lifeArea = nil
    }
    
    // MARK: - CRUD Operations Tests
    
    func testCreateGoal() async throws {
        // Given
        let title = "Test Goal"
        let description = "Test goal description"
        let goalType = "Habit"
        let targetValue = 30.0
        let targetUnit = "minutes"
        
        // When
        viewModel.createGoal(title: title, description: description, goalType: goalType, targetValue: targetValue, targetUnit: targetUnit, lifeArea: lifeArea)
        
        // Then
        XCTAssertEqual(viewModel.goals.count, 1)
        XCTAssertEqual(viewModel.goals.first?.title, title)
        XCTAssertEqual(viewModel.goals.first?.goalDescription, description)
        XCTAssertEqual(viewModel.goals.first?.goalType, goalType)
        XCTAssertEqual(viewModel.goals.first?.targetValue, targetValue)
        XCTAssertEqual(viewModel.goals.first?.targetUnit, targetUnit)
        XCTAssertEqual(viewModel.goals.first?.lifeArea?.id, lifeArea.id)
        XCTAssertNotNil(viewModel.goals.first?.id)
        XCTAssertNotNil(viewModel.goals.first?.createdAt)
        XCTAssertNotNil(viewModel.goals.first?.updatedAt)
    }
    
    func testCreateGoalWithNilValues() async throws {
        // Given
        let title = "Test Goal"
        let goalType = "Habit"
        
        // When
        viewModel.createGoal(title: title, description: nil, goalType: goalType, targetValue: nil, targetUnit: nil, lifeArea: nil)
        
        // Then
        XCTAssertEqual(viewModel.goals.count, 1)
        XCTAssertEqual(viewModel.goals.first?.title, title)
        XCTAssertEqual(viewModel.goals.first?.goalDescription, nil)
        XCTAssertEqual(viewModel.goals.first?.goalType, goalType)
        XCTAssertEqual(viewModel.goals.first?.targetValue, 0.0) // Default value
        XCTAssertEqual(viewModel.goals.first?.targetUnit, nil)
        XCTAssertEqual(viewModel.goals.first?.lifeArea, nil)
    }
    
    func testUpdateGoal() async throws {
        // Given
        viewModel.createGoal(title: "Original Title", description: "Original description", goalType: "Habit", targetValue: 10.0, targetUnit: "minutes", lifeArea: lifeArea)
        let goal = viewModel.goals.first!
        
        let updatedTitle = "Updated Title"
        let updatedDescription = "Updated description"
        let updatedGoalType = "Numeric"
        let updatedTargetValue = 50.0
        let updatedTargetUnit = "pages"
        
        // When
        viewModel.updateGoal(goal, title: updatedTitle, description: updatedDescription, goalType: updatedGoalType, targetValue: updatedTargetValue, targetUnit: updatedTargetUnit, lifeArea: lifeArea)
        
        // Then
        XCTAssertEqual(viewModel.goals.first?.title, updatedTitle)
        XCTAssertEqual(viewModel.goals.first?.goalDescription, updatedDescription)
        XCTAssertEqual(viewModel.goals.first?.goalType, updatedGoalType)
        XCTAssertEqual(viewModel.goals.first?.targetValue, updatedTargetValue)
        XCTAssertEqual(viewModel.goals.first?.targetUnit, updatedTargetUnit)
        XCTAssertNotEqual(viewModel.goals.first?.updatedAt, goal.createdAt)
    }
    
    func testDeleteGoal() async throws {
        // Given
        viewModel.createGoal(title: "Test Goal", description: nil, goalType: "Habit", targetValue: nil, targetUnit: nil, lifeArea: nil)
        XCTAssertEqual(viewModel.goals.count, 1)
        
        let goal = viewModel.goals.first!
        
        // When
        viewModel.deleteGoal(goal)
        
        // Then
        XCTAssertEqual(viewModel.goals.count, 0)
    }
    
    // MARK: - Filtering Tests
    
    func testFilterByLifeArea() throws {
        // Given
        let secondLifeArea = LifeArea(context: context)
        secondLifeArea.id = UUID()
        secondLifeArea.name = "Second Life Area"
        secondLifeArea.icon = "heart.fill"
        secondLifeArea.colorHex = "#00FF00"
        secondLifeArea.createdAt = Date()
        secondLifeArea.updatedAt = Date()
        
        try context.save()
        
        viewModel.createGoal(title: "Goal 1", description: nil, goalType: "Habit", targetValue: nil, targetUnit: nil, lifeArea: lifeArea)
        viewModel.createGoal(title: "Goal 2", description: nil, goalType: "Habit", targetValue: nil, targetUnit: nil, lifeArea: secondLifeArea)
        
        // When
        viewModel.setLifeAreaFilter(lifeArea)
        
        // Then
        XCTAssertEqual(viewModel.filteredGoals.count, 1)
        XCTAssertEqual(viewModel.filteredGoals.first?.title, "Goal 1")
    }
    
    func testFilterByGoalType() throws {
        // Given
        viewModel.createGoal(title: "Habit Goal", description: nil, goalType: "Habit", targetValue: nil, targetUnit: nil, lifeArea: nil)
        viewModel.createGoal(title: "Numeric Goal", description: nil, goalType: "Numeric", targetValue: nil, targetUnit: nil, lifeArea: nil)
        
        // When
        viewModel.setGoalTypeFilter("Habit")
        
        // Then
        XCTAssertEqual(viewModel.filteredGoals.count, 1)
        XCTAssertEqual(viewModel.filteredGoals.first?.title, "Habit Goal")
    }
    
    func testClearFilters() throws {
        // Given
        viewModel.createGoal(title: "Goal 1", description: nil, goalType: "Habit", targetValue: nil, targetUnit: nil, lifeArea: lifeArea)
        viewModel.createGoal(title: "Goal 2", description: nil, goalType: "Numeric", targetValue: nil, targetUnit: nil, lifeArea: nil)
        
        viewModel.setLifeAreaFilter(lifeArea)
        viewModel.setGoalTypeFilter("Habit")
        XCTAssertEqual(viewModel.filteredGoals.count, 1)
        
        // When
        viewModel.clearFilters()
        
        // Then
        XCTAssertEqual(viewModel.filteredGoals.count, 2)
        XCTAssertNil(viewModel.selectedLifeAreaFilter)
        XCTAssertNil(viewModel.selectedGoalTypeFilter)
    }
    
    // MARK: - Progress Calculation Tests
    
    func testCalculateProgressWithNoEntries() throws {
        // Given
        viewModel.createGoal(title: "Test Goal", description: nil, goalType: "Habit", targetValue: 100.0, targetUnit: "units", lifeArea: nil)
        let goal = viewModel.goals.first!
        
        // When
        let progress = viewModel.calculateProgress(for: goal)
        
        // Then
        XCTAssertEqual(progress, 0.0)
    }
    
    func testCalculateProgressWithEntries() throws {
        // Given
        viewModel.createGoal(title: "Test Goal", description: nil, goalType: "Habit", targetValue: 100.0, targetUnit: "units", lifeArea: nil)
        let goal = viewModel.goals.first!
        
        // Create progress entries
        let progressEntry1 = ProgressEntry(context: context)
        progressEntry1.id = UUID()
        progressEntry1.value = 30.0
        progressEntry1.date = Date()
        progressEntry1.goal = goal
        progressEntry1.createdAt = Date()
        progressEntry1.updatedAt = Date()
        
        let progressEntry2 = ProgressEntry(context: context)
        progressEntry2.id = UUID()
        progressEntry2.value = 20.0
        progressEntry2.date = Date()
        progressEntry2.goal = goal
        progressEntry2.createdAt = Date()
        progressEntry2.updatedAt = Date()
        
        try context.save()
        
        // When
        let progress = viewModel.calculateProgress(for: goal)
        
        // Then
        XCTAssertEqual(progress, 0.5) // (30 + 20) / 100 = 0.5
    }
    
    func testCalculateProgressExceedsTarget() throws {
        // Given
        viewModel.createGoal(title: "Test Goal", description: nil, goalType: "Habit", targetValue: 50.0, targetUnit: "units", lifeArea: nil)
        let goal = viewModel.goals.first!
        
        // Create progress entry that exceeds target
        let progressEntry = ProgressEntry(context: context)
        progressEntry.id = UUID()
        progressEntry.value = 75.0
        progressEntry.date = Date()
        progressEntry.goal = goal
        progressEntry.createdAt = Date()
        progressEntry.updatedAt = Date()
        
        try context.save()
        
        // When
        let progress = viewModel.calculateProgress(for: goal)
        
        // Then
        XCTAssertEqual(progress, 1.0) // Should cap at 100%
    }
    
    func testGetRecentProgress() throws {
        // Given
        viewModel.createGoal(title: "Test Goal", description: nil, goalType: "Habit", targetValue: nil, targetUnit: nil, lifeArea: nil)
        let goal = viewModel.goals.first!
        
        // Create progress entries with different dates
        let calendar = Calendar.current
        let today = Date()
        let yesterday = calendar.date(byAdding: .day, value: -1, to: today)!
        let weekAgo = calendar.date(byAdding: .day, value: -7, to: today)!
        
        let recentEntry = ProgressEntry(context: context)
        recentEntry.id = UUID()
        recentEntry.value = 10.0
        recentEntry.date = yesterday
        recentEntry.goal = goal
        recentEntry.createdAt = Date()
        recentEntry.updatedAt = Date()
        
        let oldEntry = ProgressEntry(context: context)
        oldEntry.id = UUID()
        oldEntry.value = 5.0
        oldEntry.date = weekAgo
        oldEntry.goal = goal
        oldEntry.createdAt = Date()
        oldEntry.updatedAt = Date()
        
        try context.save()
        
        // When
        let recentProgress = viewModel.getRecentProgress(for: goal, days: 3)
        
        // Then
        XCTAssertEqual(recentProgress.count, 1) // Only yesterday's entry should be included
        XCTAssertEqual(recentProgress.first?.value, 10.0)
    }
    
    // MARK: - Validation Tests
    
    func testValidateGoalWithValidData() throws {
        // Given
        let title = "Valid Goal"
        let goalType = "Habit"
        let targetValue: Double? = 100.0
        
        // When
        let isValid = viewModel.validateGoal(title: title, goalType: goalType, targetValue: targetValue)
        
        // Then
        XCTAssertTrue(isValid)
        XCTAssertNil(viewModel.errorMessage)
    }
    
    func testValidateGoalWithEmptyTitle() throws {
        // Given
        let title = ""
        let goalType = "Habit"
        let targetValue: Double? = nil
        
        // When
        let isValid = viewModel.validateGoal(title: title, goalType: goalType, targetValue: targetValue)
        
        // Then
        XCTAssertFalse(isValid)
        XCTAssertEqual(viewModel.errorMessage, "Goal title cannot be empty")
    }
    
    func testValidateGoalWithEmptyGoalType() throws {
        // Given
        let title = "Valid Goal"
        let goalType = ""
        let targetValue: Double? = nil
        
        // When
        let isValid = viewModel.validateGoal(title: title, goalType: goalType, targetValue: targetValue)
        
        // Then
        XCTAssertFalse(isValid)
        XCTAssertEqual(viewModel.errorMessage, "Goal type cannot be empty")
    }
    
    func testValidateGoalWithNegativeTargetValue() throws {
        // Given
        let title = "Valid Goal"
        let goalType = "Habit"
        let targetValue: Double? = -10.0
        
        // When
        let isValid = viewModel.validateGoal(title: title, goalType: goalType, targetValue: targetValue)
        
        // Then
        XCTAssertFalse(isValid)
        XCTAssertEqual(viewModel.errorMessage, "Target value cannot be negative")
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
}
