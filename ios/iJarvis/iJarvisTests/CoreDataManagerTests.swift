//
//  CoreDataManagerTests.swift
//  iJarvisTests
//
//  Created by Lorenzo Tomas Diez on 07/08/2025.
//

import XCTest
import CoreData
@testable import iJarvis

@MainActor
final class CoreDataManagerTests: XCTestCase {
    
    var persistenceController: PersistenceController!
    var context: NSManagedObjectContext!
    
    override func setUpWithError() throws {
        persistenceController = PersistenceController(inMemory: true)
        context = persistenceController.container.viewContext
        
        // Clear any existing data before each test
        clearAllData()
    }
    
    private func clearAllData() {
        let request: NSFetchRequest<NSFetchRequestResult> = CDLifeArea.fetchRequest()
        let deleteRequest = NSBatchDeleteRequest(fetchRequest: request)
        
        do {
            try context.execute(deleteRequest)
            try context.save()
        } catch {
            print("Failed to clear LifeArea data: \(error)")
        }
        
        let goalRequest: NSFetchRequest<NSFetchRequestResult> = CDGoal.fetchRequest()
        let deleteGoalRequest = NSBatchDeleteRequest(fetchRequest: goalRequest)
        
        do {
            try context.execute(deleteGoalRequest)
            try context.save()
        } catch {
            print("Failed to clear Goal data: \(error)")
        }
        
        let progressRequest: NSFetchRequest<NSFetchRequestResult> = CDProgressEntry.fetchRequest()
        let deleteProgressRequest = NSBatchDeleteRequest(fetchRequest: progressRequest)
        
        do {
            try context.execute(deleteProgressRequest)
            try context.save()
        } catch {
            print("Failed to clear ProgressEntry data: \(error)")
        }
        
        context.reset()
    }
    
    override func tearDownWithError() throws {
        persistenceController = nil
        context = nil
    }
    
    // MARK: - Life Area Tests
    
    func testCreateLifeArea() async throws {
        // Given
        let name = "Health"
        let type = "health"
        let color = "#FF0000"
        let icon = "heart.fill"
        
        // When
        let lifeArea = try await CoreDataManager.shared.createLifeArea(
            name: name,
            type: type,
            color: color,
            icon: icon,
            context: context
        )
        
        // Then
        XCTAssertNotNil(lifeArea.id)
        XCTAssertEqual(lifeArea.name, name)
        XCTAssertEqual(lifeArea.type, type)
        XCTAssertEqual(lifeArea.color, color)
        XCTAssertEqual(lifeArea.icon, icon)
        XCTAssertTrue(lifeArea.isActive)
        XCTAssertEqual(lifeArea.order, 0)
    }
    
    func testFetchAllLifeAreas() async throws {
        // Given
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
        
        // When
        let lifeAreas = try await CoreDataManager.shared.fetchAllLifeAreas(context: context)
        
        // Then
        XCTAssertEqual(lifeAreas.count, 2)
        XCTAssertTrue(lifeAreas.contains { $0.name == "Health" })
        XCTAssertTrue(lifeAreas.contains { $0.name == "Finance" })
    }
    
    func testUpdateLifeArea() async throws {
        // Given
        let lifeArea = try await CoreDataManager.shared.createLifeArea(
            name: "Health",
            type: "health",
            context: context
        )
        
        // When
        let updatedLifeArea = try await CoreDataManager.shared.updateLifeArea(
            id: lifeArea.id!,
            name: "Fitness",
            isActive: false,
            context: context
        )
        
        // Then
        XCTAssertEqual(updatedLifeArea.name, "Fitness")
        XCTAssertFalse(updatedLifeArea.isActive)
    }
    
    func testDeleteLifeArea() async throws {
        // Given
        let lifeArea = try await CoreDataManager.shared.createLifeArea(
            name: "Health",
            type: "health",
            context: context
        )
        
        // When
        try await CoreDataManager.shared.deleteLifeArea(id: lifeArea.id!, context: context)
        
        // Then
        let lifeAreas = try await CoreDataManager.shared.fetchAllLifeAreas(context: context)
        XCTAssertEqual(lifeAreas.count, 0)
    }
    
    // MARK: - Goal Tests
    
    func testCreateGoal() async throws {
        // Given
        let lifeArea = try await CoreDataManager.shared.createLifeArea(
            name: "Health",
            type: "health",
            context: context
        )
        
        let title = "Run 5K"
        let type = "numeric"
        let targetValue = 5.0
        
        // When
        let goal = try await CoreDataManager.shared.createGoal(
            title: title,
            type: type,
            lifeAreaId: lifeArea.id,
            targetValue: targetValue,
            context: context
        )
        
        // Then
        XCTAssertNotNil(goal.id)
        XCTAssertEqual(goal.title, title)
        XCTAssertEqual(goal.type, type)
        XCTAssertEqual(goal.targetValue, targetValue)
        XCTAssertEqual(goal.currentValue, 0.0)
        XCTAssertEqual(goal.lifeAreaId, lifeArea.id)
    }
    
    func testFetchGoalsByLifeArea() async throws {
        // Given
        let lifeArea = try await CoreDataManager.shared.createLifeArea(
            name: "Health",
            type: "health",
            context: context
        )
        
        _ = try await CoreDataManager.shared.createGoal(
            title: "Run 5K",
            type: "numeric",
            lifeAreaId: lifeArea.id,
            context: context
        )
        _ = try await CoreDataManager.shared.createGoal(
            title: "Lift weights",
            type: "habit",
            lifeAreaId: lifeArea.id,
            context: context
        )
        
        // When
        let goals = try await CoreDataManager.shared.fetchGoalsByLifeArea(
            lifeAreaId: lifeArea.id!,
            context: context
        )
        
        // Then
        XCTAssertEqual(goals.count, 2)
        XCTAssertTrue(goals.contains { $0.title == "Run 5K" })
        XCTAssertTrue(goals.contains { $0.title == "Lift weights" })
    }
    
    func testUpdateGoalProgress() async throws {
        // Given
        let goal = try await CoreDataManager.shared.createGoal(
            title: "Run 5K",
            type: "numeric",
            targetValue: 5.0,
            context: context
        )
        
        // When
        let updatedGoal = try await CoreDataManager.shared.updateGoalProgress(
            id: goal.id!,
            currentValue: 3.0,
            context: context
        )
        
        // Then
        XCTAssertEqual(updatedGoal.currentValue, 3.0)
    }
    
    // MARK: - Progress Entry Tests
    
    func testCreateProgressEntry() async throws {
        // Given
        let goal = try await CoreDataManager.shared.createGoal(
            title: "Run 5K",
            type: "numeric",
            targetValue: 5.0,
            context: context
        )
        
        let value = 3.0
        let notes = "Great run today!"
        let dataSource = "manual"
        
        // When
        let progressEntry = try await CoreDataManager.shared.createProgressEntry(
            goalId: goal.id!,
            value: value,
            notes: notes,
            dataSource: dataSource,
            context: context
        )
        
        // Then
        XCTAssertNotNil(progressEntry.id)
        XCTAssertEqual(progressEntry.value, value)
        XCTAssertEqual(progressEntry.notes, notes)
        XCTAssertEqual(progressEntry.dataSource, dataSource)
        XCTAssertNotNil(progressEntry.timestamp)
    }
    
    func testFetchProgressEntriesByGoal() async throws {
        // Given
        let goal = try await CoreDataManager.shared.createGoal(
            title: "Run 5K",
            type: "numeric",
            targetValue: 5.0,
            context: context
        )
        
        _ = try await CoreDataManager.shared.createProgressEntry(
            goalId: goal.id!,
            value: 3.0,
            notes: "First run",
            context: context
        )
        _ = try await CoreDataManager.shared.createProgressEntry(
            goalId: goal.id!,
            value: 4.0,
            notes: "Second run",
            context: context
        )
        
        // When
        let entries = try await CoreDataManager.shared.fetchProgressEntriesByGoal(
            goalId: goal.id!,
            context: context
        )
        
        // Then
        XCTAssertEqual(entries.count, 2)
        XCTAssertTrue(entries.contains { $0.notes == "First run" })
        XCTAssertTrue(entries.contains { $0.notes == "Second run" })
    }
    
    // MARK: - Error Handling Tests
    
    func testCreateLifeAreaWithInvalidData() async throws {
        // Given
        let emptyName = ""
        
        // When & Then
        do {
            _ = try await CoreDataManager.shared.createLifeArea(
                name: emptyName,
                type: "health",
                context: context
            )
            XCTFail("Should throw error for empty name")
        } catch {
            XCTAssertTrue(error is CoreDataError)
        }
    }
    
    func testUpdateNonExistentLifeArea() async throws {
        // Given
        let nonExistentId = UUID()
        
        // When & Then
        do {
            _ = try await CoreDataManager.shared.updateLifeArea(
                id: nonExistentId,
                name: "Updated",
                context: context
            )
            XCTFail("Should throw error for non-existent life area")
        } catch {
            XCTAssertTrue(error is CoreDataError, "Expected CoreDataError but got: \(type(of: error)) - \(error)")
        }
    }
    
    func testDeleteLifeAreaWithGoals() async throws {
        // Given
        let lifeArea = try await CoreDataManager.shared.createLifeArea(
            name: "Health",
            type: "health",
            context: context
        )
        
        _ = try await CoreDataManager.shared.createGoal(
            title: "Run 5K",
            type: "numeric",
            lifeAreaId: lifeArea.id,
            context: context
        )
        
        // When
        guard let lifeAreaId = lifeArea.id else {
            XCTFail("LifeArea ID should not be nil")
            return
        }
        
        try await CoreDataManager.shared.deleteLifeArea(id: lifeAreaId, context: context)
        
        // Then
        let goals = try await CoreDataManager.shared.fetchGoalsByLifeArea(
            lifeAreaId: lifeAreaId,
            context: context
        )
        XCTAssertEqual(goals.count, 0) // Goals should be deleted with cascade
    }
}

 
