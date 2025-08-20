//
//  CoreDataModelsTests.swift
//  JarvisTests
//
//  Created by Lorenzo Tomas Diez on 04/08/2025.
//

import XCTest
import CoreData
@testable import Jarvis

final class CoreDataModelsTests: XCTestCase {
    
    var persistenceController: PersistenceController!
    var context: NSManagedObjectContext!
    
    override func setUp() {
        super.setUp()
        persistenceController = PersistenceController(inMemory: true)
        context = persistenceController.container.viewContext
    }
    
    override func tearDown() {
        persistenceController = nil
        context = nil
        super.tearDown()
    }
    
    // MARK: - LifeArea Tests
    
    func testLifeAreaCreation() throws {
        // Given
        let name = "Health & Fitness"
        let icon = "heart.fill"
        let colorHex = "#FF0000"
        let description = "Physical and mental well-being"
        
        // When
        let lifeArea = LifeArea(context: context)
        lifeArea.id = UUID()
        lifeArea.name = name
        lifeArea.icon = icon
        lifeArea.colorHex = colorHex
        lifeArea.areaDescription = description
        lifeArea.createdAt = Date()
        lifeArea.updatedAt = Date()
        
        try context.save()
        
        // Then
        XCTAssertNotNil(lifeArea.id)
        XCTAssertEqual(lifeArea.name, name)
        XCTAssertEqual(lifeArea.icon, icon)
        XCTAssertEqual(lifeArea.colorHex, colorHex)
        XCTAssertEqual(lifeArea.areaDescription, description)
        XCTAssertNotNil(lifeArea.createdAt)
        XCTAssertNotNil(lifeArea.updatedAt)
    }
    
    func testLifeAreaValidation() throws {
        // Given
        let lifeArea = LifeArea(context: context)
        
        // When - Try to save without required fields
        // Then - Should fail validation
        XCTAssertThrowsError(try context.save())
        
        // Verify the entity was created but not saved
        XCTAssertNotNil(lifeArea)
        XCTAssertNil(lifeArea.name) // Required field should be nil
        
        // Test that we can save with required fields
        lifeArea.name = "Test Area"
        lifeArea.id = UUID()
        lifeArea.createdAt = Date()
        lifeArea.updatedAt = Date()
        
        // Should not throw error now
        XCTAssertNoThrow(try context.save())
    }
    
    // MARK: - Goal Tests
    
    func testGoalCreation() throws {
        // Given
        let title = "Exercise 30 minutes daily"
        let description = "Build a consistent exercise habit"
        let goalType = "Habit"
        let targetValue = 30.0
        let targetUnit = "minutes"
        
        // When
        let goal = Goal(context: context)
        goal.id = UUID()
        goal.title = title
        goal.goalDescription = description
        goal.goalType = goalType
        goal.targetValue = targetValue
        goal.targetUnit = targetUnit
        goal.createdAt = Date()
        goal.updatedAt = Date()
        
        try context.save()
        
        // Then
        XCTAssertNotNil(goal.id)
        XCTAssertEqual(goal.title, title)
        XCTAssertEqual(goal.goalDescription, description)
        XCTAssertEqual(goal.goalType, goalType)
        XCTAssertEqual(goal.targetValue, targetValue)
        XCTAssertEqual(goal.targetUnit, targetUnit)
        XCTAssertNotNil(goal.createdAt)
        XCTAssertNotNil(goal.updatedAt)
    }
    
    // MARK: - ProgressEntry Tests
    
    func testProgressEntryCreation() throws {
        // Given
        let value = 25.0
        let notes = "Felt great today, increased intensity"
        let date = Date()
        
        // When
        let progressEntry = ProgressEntry(context: context)
        progressEntry.id = UUID()
        progressEntry.value = value
        progressEntry.notes = notes
        progressEntry.date = date
        progressEntry.createdAt = Date()
        progressEntry.updatedAt = Date()
        
        try context.save()
        
        // Then
        XCTAssertNotNil(progressEntry.id)
        XCTAssertEqual(progressEntry.value, value)
        XCTAssertEqual(progressEntry.notes, notes)
        XCTAssertEqual(progressEntry.date, date)
        XCTAssertNotNil(progressEntry.createdAt)
        XCTAssertNotNil(progressEntry.updatedAt)
    }
    
    // MARK: - Relationships Tests
    
    func testLifeAreaToGoalsRelationship() throws {
        // Given
        let lifeArea = LifeArea(context: context)
        lifeArea.id = UUID()
        lifeArea.name = "Health"
        lifeArea.createdAt = Date()
        lifeArea.updatedAt = Date()
        
        let goal = Goal(context: context)
        goal.id = UUID()
        goal.title = "Exercise daily"
        goal.createdAt = Date()
        goal.updatedAt = Date()
        
        // When
        lifeArea.addToGoals(goal)
        goal.lifeArea = lifeArea
        
        try context.save()
        
        // Then
        XCTAssertEqual(lifeArea.goals?.count, 1)
        XCTAssertEqual(goal.lifeArea, lifeArea)
    }
    
    func testGoalToProgressEntriesRelationship() throws {
        // Given
        let goal = Goal(context: context)
        goal.id = UUID()
        goal.title = "Exercise daily"
        goal.createdAt = Date()
        goal.updatedAt = Date()
        
        let progressEntry = ProgressEntry(context: context)
        progressEntry.id = UUID()
        progressEntry.value = 30.0
        progressEntry.date = Date()
        progressEntry.createdAt = Date()
        progressEntry.updatedAt = Date()
        
        // When
        goal.addToProgressEntries(progressEntry)
        progressEntry.goal = goal
        
        try context.save()
        
        // Then
        XCTAssertEqual(goal.progressEntries?.count, 1)
        XCTAssertEqual(progressEntry.goal, goal)
    }
}
