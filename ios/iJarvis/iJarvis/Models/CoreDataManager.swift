//
//  CoreDataManager.swift
//  iJarvis
//
//  Created by Lorenzo Tomas Diez on 07/08/2025.
//

import Foundation
import CoreData

@MainActor
final class CoreDataManager {
    static let shared = CoreDataManager()
    
    private init() {}
    
    // MARK: - Life Area Operations
    
    func createLifeArea(
        name: String,
        type: String,
        color: String? = nil,
        icon: String? = nil,
        context: NSManagedObjectContext
    ) async throws -> CDLifeArea {
        // Validate input
        guard !name.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else {
            throw CoreDataError.invalidData("Life area name cannot be empty")
        }
        
        // Create new life area
        let lifeArea = CDLifeArea(context: context)
        lifeArea.id = UUID()
        lifeArea.name = name
        lifeArea.type = type
        lifeArea.color = color
        lifeArea.icon = icon
        lifeArea.isActive = true
        lifeArea.order = 0
        
        // Save context
        try await saveContext(context)
        
        return lifeArea
    }
    
    func fetchAllLifeAreas(context: NSManagedObjectContext) async throws -> [CDLifeArea] {
        let request: NSFetchRequest<CDLifeArea> = CDLifeArea.fetchRequest()
        request.sortDescriptors = [NSSortDescriptor(keyPath: \CDLifeArea.order, ascending: true)]
        
        do {
            return try context.fetch(request)
        } catch {
            throw CoreDataError.fetchFailed("Failed to fetch life areas: \(error.localizedDescription)")
        }
    }
    
    func fetchLifeArea(id: UUID, context: NSManagedObjectContext) async throws -> CDLifeArea {
        let request: NSFetchRequest<CDLifeArea> = CDLifeArea.fetchRequest()
        request.predicate = NSPredicate(format: "id == %@", id as CVarArg)
        request.fetchLimit = 1
        
        do {
            let results = try context.fetch(request)
            guard let lifeArea = results.first else {
                throw CoreDataError.notFound("Life area with id \(id) not found")
            }
            return lifeArea
        } catch {
            throw CoreDataError.fetchFailed("Failed to fetch life area: \(error.localizedDescription)")
        }
    }
    
    func updateLifeArea(
        id: UUID,
        name: String? = nil,
        type: String? = nil,
        color: String? = nil,
        icon: String? = nil,
        isActive: Bool? = nil,
        order: Int32? = nil,
        context: NSManagedObjectContext
    ) async throws -> CDLifeArea {
        let lifeArea = try await fetchLifeArea(id: id, context: context)
        
        if let name = name {
            guard !name.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else {
                throw CoreDataError.invalidData("Life area name cannot be empty")
            }
            lifeArea.name = name
        }
        
        if let type = type {
            lifeArea.type = type
        }
        
        if let color = color {
            lifeArea.color = color
        }
        
        if let icon = icon {
            lifeArea.icon = icon
        }
        
        if let isActive = isActive {
            lifeArea.isActive = isActive
        }
        
        if let order = order {
            lifeArea.order = order
        }
        
        try await saveContext(context)
        
        return lifeArea
    }
    
    func deleteLifeArea(id: UUID, context: NSManagedObjectContext) async throws {
        let lifeArea = try await fetchLifeArea(id: id, context: context)
        context.delete(lifeArea)
        try await saveContext(context)
    }
    
    // MARK: - Goal Operations
    
    func createGoal(
        title: String,
        type: String,
        lifeAreaId: UUID? = nil,
        targetValue: Double = 0.0,
        currentValue: Double = 0.0,
        context: NSManagedObjectContext
    ) async throws -> CDGoal {
        // Validate input
        guard !title.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else {
            throw CoreDataError.invalidData("Goal title cannot be empty")
        }
        
        // Create new goal
        let goal = CDGoal(context: context)
        goal.id = UUID()
        goal.title = title
        goal.type = type
        goal.targetValue = targetValue
        goal.currentValue = currentValue
        goal.lifeAreaId = lifeAreaId
        
        // Set up relationship with life area if provided
        if let lifeAreaId = lifeAreaId {
            let lifeArea = try await fetchLifeArea(id: lifeAreaId, context: context)
            goal.lifeArea = lifeArea
        }
        
        // Save context
        try await saveContext(context)
        
        return goal
    }
    
    func fetchAllGoals(context: NSManagedObjectContext) async throws -> [CDGoal] {
        let request: NSFetchRequest<CDGoal> = CDGoal.fetchRequest()
        request.sortDescriptors = [NSSortDescriptor(keyPath: \CDGoal.title, ascending: true)]
        
        do {
            return try context.fetch(request)
        } catch {
            throw CoreDataError.fetchFailed("Failed to fetch goals: \(error.localizedDescription)")
        }
    }
    
    func fetchGoalsByLifeArea(lifeAreaId: UUID, context: NSManagedObjectContext) async throws -> [CDGoal] {
        let request: NSFetchRequest<CDGoal> = CDGoal.fetchRequest()
        request.predicate = NSPredicate(format: "lifeAreaId == %@", lifeAreaId as CVarArg)
        request.sortDescriptors = [NSSortDescriptor(keyPath: \CDGoal.title, ascending: true)]
        
        do {
            return try context.fetch(request)
        } catch {
            throw CoreDataError.fetchFailed("Failed to fetch goals: \(error.localizedDescription)")
        }
    }
    
    func fetchGoal(id: UUID, context: NSManagedObjectContext) async throws -> CDGoal {
        let request: NSFetchRequest<CDGoal> = CDGoal.fetchRequest()
        request.predicate = NSPredicate(format: "id == %@", id as CVarArg)
        request.fetchLimit = 1
        
        do {
            let results = try context.fetch(request)
            guard let goal = results.first else {
                throw CoreDataError.notFound("Goal with id \(id) not found")
            }
            return goal
        } catch {
            throw CoreDataError.fetchFailed("Failed to fetch goal: \(error.localizedDescription)")
        }
    }
    
    func updateGoal(
        id: UUID,
        title: String? = nil,
        type: String? = nil,
        targetValue: Double? = nil,
        context: NSManagedObjectContext
    ) async throws -> CDGoal {
        let goal = try await fetchGoal(id: id, context: context)
        
        if let title = title {
            guard !title.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else {
                throw CoreDataError.invalidData("Goal title cannot be empty")
            }
            goal.title = title
        }
        
        if let type = type {
            goal.type = type
        }
        
        if let targetValue = targetValue {
            goal.targetValue = targetValue
        }
        
        try await saveContext(context)
        
        return goal
    }
    
    func updateGoalProgress(
        id: UUID,
        currentValue: Double,
        context: NSManagedObjectContext
    ) async throws -> CDGoal {
        let goal = try await fetchGoal(id: id, context: context)
        goal.currentValue = currentValue
        try await saveContext(context)
        return goal
    }
    
    func deleteGoal(id: UUID, context: NSManagedObjectContext) async throws {
        let goal = try await fetchGoal(id: id, context: context)
        context.delete(goal)
        try await saveContext(context)
    }
    
    // MARK: - Progress Entry Operations
    
    func createProgressEntry(
        goalId: UUID,
        value: Double,
        notes: String? = nil,
        dataSource: String = "manual",
        metadata: [String: Any]? = nil,
        context: NSManagedObjectContext
    ) async throws -> CDProgressEntry {
        // Validate that goal exists
        _ = try await fetchGoal(id: goalId, context: context)
        
        // Create new progress entry
        let progressEntry = CDProgressEntry(context: context)
        progressEntry.id = UUID()
        progressEntry.value = value
        progressEntry.notes = notes
        progressEntry.dataSource = dataSource
        progressEntry.timestamp = Date()
        progressEntry.metadata = metadata
        
        // Set up relationship with goal
        let goal = try await fetchGoal(id: goalId, context: context)
        progressEntry.goal = goal
        
        // Update goal's current value if this is a numeric goal
        if goal.type == "numeric" {
            goal.currentValue = value
        }
        
        // Save context
        try await saveContext(context)
        
        return progressEntry
    }
    
    func fetchAllProgressEntries(context: NSManagedObjectContext) async throws -> [CDProgressEntry] {
        let request: NSFetchRequest<CDProgressEntry> = CDProgressEntry.fetchRequest()
        request.sortDescriptors = [NSSortDescriptor(keyPath: \CDProgressEntry.timestamp, ascending: false)]
        
        do {
            return try context.fetch(request)
        } catch {
            throw CoreDataError.fetchFailed("Failed to fetch progress entries: \(error.localizedDescription)")
        }
    }
    
    func fetchProgressEntriesByGoal(goalId: UUID, context: NSManagedObjectContext) async throws -> [CDProgressEntry] {
        let request: NSFetchRequest<CDProgressEntry> = CDProgressEntry.fetchRequest()
        request.predicate = NSPredicate(format: "goal.id == %@", goalId as CVarArg)
        request.sortDescriptors = [NSSortDescriptor(keyPath: \CDProgressEntry.timestamp, ascending: false)]
        
        do {
            return try context.fetch(request)
        } catch {
            throw CoreDataError.fetchFailed("Failed to fetch progress entries: \(error.localizedDescription)")
        }
    }
    
    func fetchProgressEntry(id: UUID, context: NSManagedObjectContext) async throws -> CDProgressEntry {
        let request: NSFetchRequest<CDProgressEntry> = CDProgressEntry.fetchRequest()
        request.predicate = NSPredicate(format: "id == %@", id as CVarArg)
        request.fetchLimit = 1
        
        do {
            let results = try context.fetch(request)
            guard let progressEntry = results.first else {
                throw CoreDataError.notFound("Progress entry with id \(id) not found")
            }
            return progressEntry
        } catch {
            throw CoreDataError.fetchFailed("Failed to fetch progress entry: \(error.localizedDescription)")
        }
    }
    
    func updateProgressEntry(
        id: UUID,
        value: Double? = nil,
        notes: String? = nil,
        dataSource: String? = nil,
        metadata: [String: Any]? = nil,
        context: NSManagedObjectContext
    ) async throws -> CDProgressEntry {
        let progressEntry = try await fetchProgressEntry(id: id, context: context)
        
        if let value = value {
            progressEntry.value = value
            
            // Update goal's current value if this is a numeric goal
            if let goal = progressEntry.goal, goal.type == "numeric" {
                goal.currentValue = value
            }
        }
        
        if let notes = notes {
            progressEntry.notes = notes
        }
        
        if let dataSource = dataSource {
            progressEntry.dataSource = dataSource
        }
        
        if let metadata = metadata {
            progressEntry.metadata = metadata
        }
        
        try await saveContext(context)
        
        return progressEntry
    }
    
    func deleteProgressEntry(id: UUID, context: NSManagedObjectContext) async throws {
        let progressEntry = try await fetchProgressEntry(id: id, context: context)
        context.delete(progressEntry)
        try await saveContext(context)
    }
    
    // MARK: - Helper Methods
    
    private func saveContext(_ context: NSManagedObjectContext) async throws {
        do {
            try context.save()
        } catch {
            throw CoreDataError.saveFailed("Failed to save context: \(error.localizedDescription)")
        }
    }
} 