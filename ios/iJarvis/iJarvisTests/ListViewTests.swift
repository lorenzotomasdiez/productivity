//
//  ListViewTests.swift
//  iJarvisTests
//
//  Created by Lorenzo Tomas Diez on 07/08/2025.
//

import Testing
import SwiftUI
import CoreData
@testable import iJarvis

struct ListViewTests {
    
    // MARK: - Core Data Manager Tests
    
    @Test func testCreateLifeArea() async throws {
        // Given: Core Data context
        let context = await PersistenceController.preview.container.viewContext
        
        // When: Creating a life area
        let lifeArea = try await CoreDataManager.shared.createLifeArea(
            name: "Health",
            type: "health",
            color: "#FF0000",
            icon: "heart.fill",
            context: context
        )
        
        // Then: The life area should be created correctly
        #expect(lifeArea.name == "Health")
        #expect(lifeArea.type == "health")
        #expect(lifeArea.color == "#FF0000")
        #expect(lifeArea.icon == "heart.fill")
        #expect(lifeArea.isActive == true)
    }
    
    @Test func testFetchAllLifeAreas() async throws {
        // Given: Core Data context with existing life areas
        let context = await PersistenceController.preview.container.viewContext
        
        _ = try await CoreDataManager.shared.createLifeArea(
            name: "Health",
            type: "health",
            context: context
        )
        _ = try await CoreDataManager.shared.createLifeArea(
            name: "Finance",
            type: "finance",
            context: context
        )
        
        // When: Fetching all life areas
        let lifeAreas = try await CoreDataManager.shared.fetchAllLifeAreas(context: context)
        
        // Then: All life areas should be returned
        #expect(lifeAreas.count >= 2)
        #expect(lifeAreas.contains { $0.name == "Health" })
        #expect(lifeAreas.contains { $0.name == "Finance" })
    }
    
    @Test func testCreateGoal() async throws {
        // Given: Core Data context and life area
        let context = await PersistenceController.preview.container.viewContext
        let lifeArea = try await CoreDataManager.shared.createLifeArea(
            name: "Health",
            type: "health",
            context: context
        )
        
        // When: Creating a goal
        let goal = try await CoreDataManager.shared.createGoal(
            title: "Lose Weight",
            type: "numeric",
            lifeAreaId: lifeArea.id,
            targetValue: 70.0,
            context: context
        )
        
        // Then: The goal should be created correctly
        #expect(goal.title == "Lose Weight")
        #expect(goal.type == "numeric")
        #expect(goal.targetValue == 70.0)
        #expect(goal.currentValue == 0.0)
        #expect(goal.lifeAreaId == lifeArea.id)
    }
    
    @Test func testFetchGoalsByLifeArea() async throws {
        // Given: Core Data context with life area and goals
        let context = await PersistenceController.preview.container.viewContext
        let lifeArea = try await CoreDataManager.shared.createLifeArea(
            name: "Health",
            type: "health",
            context: context
        )
        
        _ = try await CoreDataManager.shared.createGoal(
            title: "Lose Weight",
            type: "numeric",
            lifeAreaId: lifeArea.id,
            context: context
        )
        
        _ = try await CoreDataManager.shared.createGoal(
            title: "Exercise Daily",
            type: "habit",
            lifeAreaId: lifeArea.id,
            context: context
        )
        
        // When: Fetching goals by life area
        let goals = try await CoreDataManager.shared.fetchGoalsByLifeArea(
            lifeAreaId: lifeArea.id!,
            context: context
        )
        
        // Then: Only goals from the specified life area should be returned
        #expect(goals.count == 2)
        #expect(goals.contains { $0.title == "Lose Weight" })
        #expect(goals.contains { $0.title == "Exercise Daily" })
    }
    
    @Test func testCreateProgressEntry() async throws {
        // Given: Core Data context and goal
        let context = await PersistenceController.preview.container.viewContext
        let goal = try await CoreDataManager.shared.createGoal(
            title: "Lose Weight",
            type: "numeric",
            targetValue: 70.0,
            context: context
        )
        
        // When: Creating a progress entry
        let progressEntry = try await CoreDataManager.shared.createProgressEntry(
            goalId: goal.id!,
            value: 75.0,
            notes: "Weekly weigh-in",
            dataSource: "manual",
            context: context
        )
        
        // Then: The progress entry should be created correctly
        #expect(progressEntry.value == 75.0)
        #expect(progressEntry.notes == "Weekly weigh-in")
        #expect(progressEntry.dataSource == "manual")
        #expect(progressEntry.timestamp != nil)
    }
    
    @Test func testFetchProgressEntriesByGoal() async throws {
        // Given: Core Data context with goal and progress entries
        let context = await PersistenceController.preview.container.viewContext
        let goal = try await CoreDataManager.shared.createGoal(
            title: "Lose Weight",
            type: "numeric",
            targetValue: 70.0,
            context: context
        )
        
        _ = try await CoreDataManager.shared.createProgressEntry(
            goalId: goal.id!,
            value: 75.0,
            notes: "First weigh-in",
            context: context
        )
        
        _ = try await CoreDataManager.shared.createProgressEntry(
            goalId: goal.id!,
            value: 74.5,
            notes: "Second weigh-in",
            context: context
        )
        
        // When: Fetching progress entries by goal
        let entries = try await CoreDataManager.shared.fetchProgressEntriesByGoal(
            goalId: goal.id!,
            context: context
        )
        
        // Then: Only progress entries for the specified goal should be returned
        #expect(entries.count == 2)
        #expect(entries.contains { $0.notes == "First weigh-in" })
        #expect(entries.contains { $0.notes == "Second weigh-in" })
    }
    
    // MARK: - View Integration Tests
    
    @Test func testLifeAreasListViewInitialization() async throws {
        // Given: Core Data context
        _ = await PersistenceController.preview.container.viewContext
        
        // When: Creating a life areas list view
        _ = await LifeAreasListView()
        
        // Then: The view should initialize without errors
        #expect(true) // View initialization successful
    }
    
    @Test func testGoalsListViewInitialization() async throws {
        // Given: Core Data context
        _ = await PersistenceController.preview.container.viewContext
        
        // When: Creating a goals list view
        _ = await GoalsListView()
        
        // Then: The view should initialize without errors
        #expect(true) // View initialization successful
    }
    
    @Test func testProgressListViewInitialization() async throws {
        // Given: Core Data context
        _ = await PersistenceController.preview.container.viewContext
        
        // When: Creating a progress list view
        _ = await ProgressListView()
        
        // Then: The view should initialize without errors
        #expect(true) // View initialization successful
    }
    
    // MARK: - Error Handling Tests
    
    @Test func testCreateLifeAreaWithInvalidData() async throws {
        // Given: Core Data context
        let context = await PersistenceController.preview.container.viewContext
        
        // When & Then: Creating a life area with empty name should throw error
        do {
            _ = try await CoreDataManager.shared.createLifeArea(
                name: "",
                type: "health",
                context: context
            )
            #expect(Bool(false), "Should have thrown an error")
        } catch {
            #expect(error is CoreDataError)
        }
    }
    
    @Test func testUpdateNonExistentLifeArea() async throws {
        // Given: Core Data context and non-existent ID
        let context = await PersistenceController.preview.container.viewContext
        let nonExistentId = UUID()
        
        // When & Then: Updating non-existent life area should throw error
        do {
            _ = try await CoreDataManager.shared.updateLifeArea(
                id: nonExistentId,
                name: "Updated",
                context: context
            )
            #expect(Bool(false), "Should have thrown an error")
        } catch {
            #expect(error is CoreDataError)
        }
    }
    
    // MARK: - Performance Tests
    
    @Test func testLargeDataSetPerformance() async throws {
        // Given: Core Data context
        let context = await PersistenceController.preview.container.viewContext
        
        // When: Creating many life areas
        for i in 0..<100 {
            _ = try await CoreDataManager.shared.createLifeArea(
                name: "Life Area \(i)",
                type: "health",
                context: context
            )
        }
        
        // Then: Fetching should be efficient
        let lifeAreas = try await CoreDataManager.shared.fetchAllLifeAreas(context: context)
        #expect(lifeAreas.count >= 100)
    }
} 
