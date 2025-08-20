//
//  ProgressViewModel.swift
//  Jarvis
//
//  Created by Lorenzo Tomas Diez on 04/08/2025.
//
//  ProgressViewModel.swift
//  Jarvis
//
//  Created by Lorenzo Tomas Diez on 04/08/2025.
//

import Foundation
import CoreData
import SwiftUI

class ProgressViewModel: ObservableObject {
    @Published var progressEntries: [ProgressEntry] = []
    @Published var filteredEntries: [ProgressEntry] = []
    @Published var isLoading = false
    @Published var errorMessage: String?
    @Published var selectedGoalFilter: Goal?
    @Published var selectedDateRange: DateRange = .week
    
    private let viewContext: NSManagedObjectContext
    
    enum DateRange: String, CaseIterable {
        case day = "Today"
        case week = "This Week"
        case month = "This Month"
        case year = "This Year"
        case all = "All Time"
        
        var days: Int? {
            switch self {
            case .day: return 1
            case .week: return 7
            case .month: return 30
            case .year: return 365
            case .all: return nil
            }
        }
    }
    
    init(context: NSManagedObjectContext) {
        self.viewContext = context
        fetchProgressEntries()
    }
    
    // MARK: - CRUD Operations
    
    func fetchProgressEntries() {
        isLoading = true
        errorMessage = nil
        
        let request: NSFetchRequest<ProgressEntry> = ProgressEntry.fetchRequest()
        request.sortDescriptors = [NSSortDescriptor(keyPath: \ProgressEntry.date, ascending: false)]
        
        do {
            progressEntries = try viewContext.fetch(request)
            applyFilters()
        } catch {
            errorMessage = "Failed to fetch progress entries: \(error.localizedDescription)"
        }
        
        isLoading = false
    }
    
    func createProgressEntry(value: Double, notes: String?, date: Date, goal: Goal) {
        let newEntry = ProgressEntry(context: viewContext)
        newEntry.id = UUID()
        newEntry.value = value
        newEntry.notes = notes
        newEntry.date = date
        newEntry.goal = goal
        newEntry.createdAt = Date()
        newEntry.updatedAt = Date()
        
        saveContext()
    }
    
    func updateProgressEntry(_ entry: ProgressEntry, value: Double, notes: String?, date: Date) {
        entry.value = value
        entry.notes = notes
        entry.date = date
        entry.updatedAt = Date()
        
        saveContext()
    }
    
    func deleteProgressEntry(_ entry: ProgressEntry) {
        viewContext.delete(entry)
        saveContext()
    }
    
    // MARK: - Filtering
    
    func applyFilters() {
        var filtered = progressEntries
        
        if let goalFilter = selectedGoalFilter {
            filtered = filtered.filter { $0.goal?.id == goalFilter.id }
        }
        
        if let days = selectedDateRange.days {
            let cutoffDate = Calendar.current.date(byAdding: .day, value: -days, to: Date()) ?? Date()
            filtered = filtered.filter { 
                guard let entryDate = $0.date else { return false }
                return entryDate >= cutoffDate 
            }
        }
        
        filteredEntries = filtered
    }
    
    func setGoalFilter(_ goal: Goal?) {
        selectedGoalFilter = goal
        applyFilters()
    }
    
    func setDateRange(_ dateRange: DateRange) {
        selectedDateRange = dateRange
        applyFilters()
    }
    
    func clearFilters() {
        selectedGoalFilter = nil
        selectedDateRange = .week
        applyFilters()
    }
    
    // MARK: - Analytics
    
    func getTotalProgress(for goal: Goal, in dateRange: DateRange) -> Double {
        let entries = getProgressEntries(for: goal, in: dateRange)
        return entries.reduce(0.0) { $0 + $1.value }
    }
    
    func getAverageProgress(for goal: Goal, in dateRange: DateRange) -> Double {
        let entries = getProgressEntries(for: goal, in: dateRange)
        guard !entries.isEmpty else { return 0.0 }
        
        let total = entries.reduce(0.0) { $0 + $1.value }
        return total / Double(entries.count)
    }
    
    func getProgressEntries(for goal: Goal, in dateRange: DateRange) -> [ProgressEntry] {
        guard let days = dateRange.days else {
            return goal.progressEntries?.allObjects as? [ProgressEntry] ?? []
        }
        
        let cutoffDate = Calendar.current.date(byAdding: .day, value: -days, to: Date()) ?? Date()
        return (goal.progressEntries?.allObjects as? [ProgressEntry] ?? [])
            .filter { 
                guard let entryDate = $0.date else { return false }
                return entryDate >= cutoffDate 
            }
            .sorted { 
                guard let date1 = $0.date, let date2 = $1.date else { return false }
                return date1 > date2 
            }
    }
    
    func getProgressTrend(for goal: Goal, days: Int = 7) -> [Double] {
        let entries = getProgressEntries(for: goal, in: .week)
        let calendar = Calendar.current
        
        var dailyProgress: [Double] = Array(repeating: 0.0, count: days)
        
        for entry in entries {
            guard let entryDate = entry.date else { continue }
            let daysAgo = calendar.dateComponents([.day], from: entryDate, to: Date()).day ?? 0
            if daysAgo < days && daysAgo >= 0 {
                dailyProgress[daysAgo] += entry.value
            }
        }
        
        return dailyProgress.reversed()
    }
    
    // MARK: - Helper Methods
    
    private func saveContext() {
        do {
            try viewContext.save()
            fetchProgressEntries() // Refresh the list
        } catch {
            errorMessage = "Failed to save changes: \(error.localizedDescription)"
        }
    }
    
    func clearError() {
        errorMessage = nil
    }
    
    // MARK: - Validation
    
    func validateProgressEntry(value: Double, date: Date) -> Bool {
        guard value >= 0 else {
            errorMessage = "Progress value cannot be negative"
            return false
        }
        
        guard date <= Date() else {
            errorMessage = "Progress date cannot be in the future"
            return false
        }
        
        return true
    }
}
