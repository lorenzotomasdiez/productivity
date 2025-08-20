//
//  ProgressViewModelTests.swift
//  JarvisTests
//
//  Created by Lorenzo Tomas Diez on 04/08/2025.
//

import XCTest
import CoreData
import SwiftUI
@testable import Jarvis

@MainActor
final class ProgressViewModelTests: XCTestCase {
    var viewModel: ProgressViewModel!
    var context: NSManagedObjectContext!
    var container: NSPersistentContainer!
    var goal: Goal!
    
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
        
        // Create a test goal
        goal = Goal(context: context)
        goal.id = UUID()
        goal.title = "Test Goal"
        goal.goalDescription = "Test goal description"
        goal.goalType = "Habit"
        goal.targetValue = 100.0
        goal.targetUnit = "units"
        goal.createdAt = Date()
        goal.updatedAt = Date()
        
        try context.save()
        
        viewModel = ProgressViewModel(context: context)
    }
    
    override func tearDownWithError() throws {
        viewModel = nil
        context = nil
        container = nil
        goal = nil
    }
    
    // MARK: - CRUD Operations Tests
    
    func testCreateProgressEntry() throws {
        // Given
        let value = 25.0
        let notes = "Great progress today!"
        let date = Date()
        
        // When
        viewModel.createProgressEntry(value: value, notes: notes, date: date, goal: goal)
        
        // Then
        XCTAssertEqual(viewModel.progressEntries.count, 1)
        XCTAssertEqual(viewModel.progressEntries.first?.value, value)
        XCTAssertEqual(viewModel.progressEntries.first?.notes, notes)
        XCTAssertEqual(viewModel.progressEntries.first?.date, date)
        XCTAssertEqual(viewModel.progressEntries.first?.goal?.id, goal.id)
        XCTAssertNotNil(viewModel.progressEntries.first?.id)
        XCTAssertNotNil(viewModel.progressEntries.first?.createdAt)
        XCTAssertNotNil(viewModel.progressEntries.first?.updatedAt)
    }
    
    func testUpdateProgressEntry() throws {
        // Given
        viewModel.createProgressEntry(value: 10.0, notes: "Original notes", date: Date(), goal: goal)
        let entry = viewModel.progressEntries.first!
        
        let updatedValue = 15.0
        let updatedNotes = "Updated notes"
        let updatedDate = Calendar.current.date(byAdding: .day, value: -1, to: Date())!
        
        // When
        viewModel.updateProgressEntry(entry, value: updatedValue, notes: updatedNotes, date: updatedDate)
        
        // Then
        XCTAssertEqual(viewModel.progressEntries.first?.value, updatedValue)
        XCTAssertEqual(viewModel.progressEntries.first?.notes, updatedNotes)
        XCTAssertEqual(viewModel.progressEntries.first?.date, updatedDate)
        XCTAssertNotEqual(viewModel.progressEntries.first?.updatedAt, entry.createdAt)
    }
    
    func testDeleteProgressEntry() throws {
        // Given
        viewModel.createProgressEntry(value: 10.0, notes: nil, date: Date(), goal: goal)
        XCTAssertEqual(viewModel.progressEntries.count, 1)
        
        let entry = viewModel.progressEntries.first!
        
        // When
        viewModel.deleteProgressEntry(entry)
        
        // Then
        XCTAssertEqual(viewModel.progressEntries.count, 0)
    }
    
    // MARK: - Filtering Tests
    
    func testFilterByGoal() throws {
        // Given
        let secondGoal = Goal(context: context)
        secondGoal.id = UUID()
        secondGoal.title = "Second Goal"
        secondGoal.goalType = "Numeric"
        secondGoal.createdAt = Date()
        secondGoal.updatedAt = Date()
        
        try context.save()
        
        viewModel.createProgressEntry(value: 10.0, notes: nil, date: Date(), goal: goal)
        viewModel.createProgressEntry(value: 20.0, notes: nil, date: Date(), goal: secondGoal)
        
        // When
        viewModel.setGoalFilter(goal)
        
        // Then
        XCTAssertEqual(viewModel.filteredEntries.count, 1)
        XCTAssertEqual(viewModel.filteredEntries.first?.value, 10.0)
    }
    
    func testFilterByDateRange() throws {
        // Given
        let calendar = Calendar.current
        let today = Date()
        let yesterday = calendar.date(byAdding: .day, value: -1, to: today)!
        let weekAgo = calendar.date(byAdding: .day, value: -6, to: today)! // Use -6 instead of -7 to avoid edge case
        let monthAgo = calendar.date(byAdding: .day, value: -30, to: today)!
        
        viewModel.createProgressEntry(value: 10.0, notes: nil, date: today, goal: goal)
        viewModel.createProgressEntry(value: 20.0, notes: nil, date: yesterday, goal: goal)
        viewModel.createProgressEntry(value: 30.0, notes: nil, date: weekAgo, goal: goal)
        viewModel.createProgressEntry(value: 40.0, notes: nil, date: monthAgo, goal: goal)
        
        // When - Filter by week
        viewModel.setDateRange(.week)
        
        // Then
        XCTAssertEqual(viewModel.filteredEntries.count, 3) // today, yesterday, weekAgo
    }
    
    func testFilterByDateRangeAll() throws {
        // Given
        let calendar = Calendar.current
        let today = Date()
        let yesterday = calendar.date(byAdding: .day, value: -1, to: today)!
        let weekAgo = calendar.date(byAdding: .day, value: -7, to: today)!
        
        viewModel.createProgressEntry(value: 10.0, notes: nil, date: today, goal: goal)
        viewModel.createProgressEntry(value: 20.0, notes: nil, date: yesterday, goal: goal)
        viewModel.createProgressEntry(value: 30.0, notes: nil, date: weekAgo, goal: goal)
        
        // When - Filter by all time
        viewModel.setDateRange(.all)
        
        // Then
        XCTAssertEqual(viewModel.filteredEntries.count, 3)
    }
    
    func testClearFilters() throws {
        // Given
        viewModel.createProgressEntry(value: 10.0, notes: nil, date: Date(), goal: goal)
        
        viewModel.setGoalFilter(goal)
        viewModel.setDateRange(.day)
        XCTAssertEqual(viewModel.filteredEntries.count, 1)
        
        // When
        viewModel.clearFilters()
        
        // Then
        XCTAssertEqual(viewModel.filteredEntries.count, 1) // Should show all entries
        XCTAssertNil(viewModel.selectedGoalFilter)
        XCTAssertEqual(viewModel.selectedDateRange, .week) // Default value
    }
    
    // MARK: - Analytics Tests
    
    func testGetTotalProgress() throws {
        // Given
        let calendar = Calendar.current
        let today = Date()
        let yesterday = calendar.date(byAdding: .day, value: -1, to: today)!
        
        viewModel.createProgressEntry(value: 10.0, notes: nil, date: today, goal: goal)
        viewModel.createProgressEntry(value: 20.0, notes: nil, date: yesterday, goal: goal)
        
        // When
        let totalProgress = viewModel.getTotalProgress(for: goal, in: .week)
        
        // Then
        XCTAssertEqual(totalProgress, 30.0) // 10 + 20
    }
    
    func testGetAverageProgress() throws {
        // Given
        let calendar = Calendar.current
        let today = Date()
        let yesterday = calendar.date(byAdding: .day, value: -1, to: today)!
        
        viewModel.createProgressEntry(value: 10.0, notes: nil, date: today, goal: goal)
        viewModel.createProgressEntry(value: 20.0, notes: nil, date: yesterday, goal: goal)
        
        // When
        let averageProgress = viewModel.getAverageProgress(for: goal, in: .week)
        
        // Then
        XCTAssertEqual(averageProgress, 15.0) // (10 + 20) / 2
    }
    
    func testGetAverageProgressWithNoEntries() throws {
        // Given
        // No progress entries created
        
        // When
        let averageProgress = viewModel.getAverageProgress(for: goal, in: .week)
        
        // Then
        XCTAssertEqual(averageProgress, 0.0)
    }
    
    func testGetProgressEntriesForGoal() throws {
        // Given
        let calendar = Calendar.current
        let today = Date()
        let yesterday = calendar.date(byAdding: .day, value: -1, to: today)!
        let weekAgo = calendar.date(byAdding: .day, value: -7, to: today)!
        
        viewModel.createProgressEntry(value: 10.0, notes: nil, date: today, goal: goal)
        viewModel.createProgressEntry(value: 20.0, notes: nil, date: yesterday, goal: goal)
        viewModel.createProgressEntry(value: 30.0, notes: nil, date: weekAgo, goal: goal)
        
        // When
        let entries = viewModel.getProgressEntries(for: goal, in: .week)
        
        // Then
        XCTAssertEqual(entries.count, 2) // today and yesterday only
        XCTAssertEqual(entries.first?.value, 10.0) // Should be sorted by date descending
        XCTAssertEqual(entries.last?.value, 20.0)
    }
    
    func testGetProgressTrend() throws {
        // Given
        let calendar = Calendar.current
        let today = Date()
        let yesterday = calendar.date(byAdding: .day, value: -1, to: today)!
        let twoDaysAgo = calendar.date(byAdding: .day, value: -2, to: today)!
        
        viewModel.createProgressEntry(value: 10.0, notes: nil, date: today, goal: goal)
        viewModel.createProgressEntry(value: 20.0, notes: nil, date: yesterday, goal: goal)
        viewModel.createProgressEntry(value: 30.0, notes: nil, date: twoDaysAgo, goal: goal)
        
        // When
        let trend = viewModel.getProgressTrend(for: goal, days: 3)
        
        // Then
        XCTAssertEqual(trend.count, 3)
        XCTAssertEqual(trend[0], 30.0) // twoDaysAgo
        XCTAssertEqual(trend[1], 20.0) // yesterday
        XCTAssertEqual(trend[2], 10.0) // today
    }
    
    // MARK: - Validation Tests
    
    func testValidateProgressEntryWithValidData() throws {
        // Given
        let value = 25.0
        let date = Date()
        
        // When
        let isValid = viewModel.validateProgressEntry(value: value, date: date)
        
        // Then
        XCTAssertTrue(isValid)
        XCTAssertNil(viewModel.errorMessage)
    }
    
    func testValidateProgressEntryWithNegativeValue() throws {
        // Given
        let value = -10.0
        let date = Date()
        
        // When
        let isValid = viewModel.validateProgressEntry(value: value, date: date)
        
        // Then
        XCTAssertFalse(isValid)
        XCTAssertEqual(viewModel.errorMessage, "Progress value cannot be negative")
    }
    
    func testValidateProgressEntryWithFutureDate() throws {
        // Given
        let value = 25.0
        let futureDate = Calendar.current.date(byAdding: .day, value: 1, to: Date())!
        
        // When
        let isValid = viewModel.validateProgressEntry(value: value, date: futureDate)
        
        // Then
        XCTAssertFalse(isValid)
        XCTAssertEqual(viewModel.errorMessage, "Progress date cannot be in the future")
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
    
    // MARK: - DateRange Enum Tests
    
    func testDateRangeDays() throws {
        // Given & When & Then
        XCTAssertEqual(ProgressViewModel.DateRange.day.days, 1)
        XCTAssertEqual(ProgressViewModel.DateRange.week.days, 7)
        XCTAssertEqual(ProgressViewModel.DateRange.month.days, 30)
        XCTAssertEqual(ProgressViewModel.DateRange.year.days, 365)
        XCTAssertNil(ProgressViewModel.DateRange.all.days)
    }
    
    func testDateRangeRawValues() throws {
        // Given & When & Then
        XCTAssertEqual(ProgressViewModel.DateRange.day.rawValue, "Today")
        XCTAssertEqual(ProgressViewModel.DateRange.week.rawValue, "This Week")
        XCTAssertEqual(ProgressViewModel.DateRange.month.rawValue, "This Month")
        XCTAssertEqual(ProgressViewModel.DateRange.year.rawValue, "This Year")
        XCTAssertEqual(ProgressViewModel.DateRange.all.rawValue, "All Time")
    }
}
