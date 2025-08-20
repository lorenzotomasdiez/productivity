//
//  Persistence.swift
//  Jarvis
//
//  Created by Lorenzo Tomas Diez on 04/08/2025.
//

import CoreData

struct PersistenceController {
    static let shared = PersistenceController()

    @MainActor
    static let preview: PersistenceController = {
        let result = PersistenceController(inMemory: true)
        let viewContext = result.container.viewContext
        
        // Create sample LifeArea
        let healthArea = LifeArea(context: viewContext)
        healthArea.id = UUID()
        healthArea.name = "Health & Fitness"
        healthArea.icon = "heart.fill"
        healthArea.colorHex = "#FF0000"
        healthArea.areaDescription = "Physical and mental well-being"
        healthArea.createdAt = Date()
        healthArea.updatedAt = Date()
        
        // Create sample Goal
        let exerciseGoal = Goal(context: viewContext)
        exerciseGoal.id = UUID()
        exerciseGoal.title = "Exercise 30 minutes daily"
        exerciseGoal.goalDescription = "Build a consistent exercise habit"
        exerciseGoal.goalType = "Habit"
        exerciseGoal.targetValue = 30.0
        exerciseGoal.targetUnit = "minutes"
        exerciseGoal.createdAt = Date()
        exerciseGoal.updatedAt = Date()
        exerciseGoal.lifeArea = healthArea
        
        // Create sample ProgressEntry
        let progressEntry = ProgressEntry(context: viewContext)
        progressEntry.id = UUID()
        progressEntry.value = 25.0
        progressEntry.notes = "Felt great today, increased intensity"
        progressEntry.date = Date()
        progressEntry.createdAt = Date()
        progressEntry.updatedAt = Date()
        progressEntry.goal = exerciseGoal
        
        do {
            try viewContext.save()
        } catch {
            let nsError = error as NSError
            fatalError("Unresolved error \(nsError), \(nsError.userInfo)")
        }
        
        return result
    }()

    let container: NSPersistentContainer

    init(inMemory: Bool = false) {
        container = NSPersistentContainer(name: "Jarvis")
        if inMemory {
            container.persistentStoreDescriptions.first!.url = URL(fileURLWithPath: "/dev/null")
        }
        container.loadPersistentStores(completionHandler: { (storeDescription, error) in
            if let error = error as NSError? {
                // Replace this implementation with code to handle the error appropriately.
                // fatalError() causes the application to generate a crash log and terminate. You should not use this function in a shipping application, although it may be useful during development.

                /*
                 Typical reasons for an error here include:
                 * The parent directory does not exist, cannot be created, or disallows writing.
                 * The persistent store is not accessible, due to permissions or data protection when the device is locked.
                 * The device is out of space.
                 * The store could not be migrated to the current model version.
                 Check the error message to determine what the actual problem was.
                 */
                fatalError("Unresolved error \(error), \(error.userInfo)")
            }
        })
        container.viewContext.automaticallyMergesChangesFromParent = true
    }
}
