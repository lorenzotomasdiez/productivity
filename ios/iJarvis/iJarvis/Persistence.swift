//
//  Persistence.swift
//  iJarvis
//
//  Created by Lorenzo Tomas Diez on 07/08/2025.
//

import CoreData

struct PersistenceController {
    static let shared = PersistenceController()

    @MainActor
    static let preview: PersistenceController = {
        let result = PersistenceController(inMemory: true)
        let viewContext = result.container.viewContext
        
        // Create sample life areas
        let healthLifeArea = CDLifeArea(context: viewContext)
        healthLifeArea.id = UUID()
        healthLifeArea.name = "Health & Fitness"
        healthLifeArea.type = "health"
        healthLifeArea.color = "#FF6B6B"
        healthLifeArea.icon = "heart.fill"
        healthLifeArea.isActive = true
        healthLifeArea.order = 0
        
        let careerLifeArea = CDLifeArea(context: viewContext)
        careerLifeArea.id = UUID()
        careerLifeArea.name = "Career"
        careerLifeArea.type = "career"
        careerLifeArea.color = "#4ECDC4"
        careerLifeArea.icon = "briefcase.fill"
        careerLifeArea.isActive = true
        careerLifeArea.order = 1
        
        // Create sample goals
        let weightGoal = CDGoal(context: viewContext)
        weightGoal.id = UUID()
        weightGoal.title = "Lose 10 pounds"
        weightGoal.type = "numeric"
        weightGoal.targetValue = 10.0
        weightGoal.currentValue = 3.0
        weightGoal.lifeAreaId = healthLifeArea.id
        weightGoal.lifeArea = healthLifeArea
        
        let exerciseGoal = CDGoal(context: viewContext)
        exerciseGoal.id = UUID()
        exerciseGoal.title = "Exercise 5 times per week"
        exerciseGoal.type = "habit"
        exerciseGoal.targetValue = 5.0
        exerciseGoal.currentValue = 3.0
        exerciseGoal.lifeAreaId = healthLifeArea.id
        exerciseGoal.lifeArea = healthLifeArea
        
        // Create sample progress entries
        let progressEntry1 = CDProgressEntry(context: viewContext)
        progressEntry1.id = UUID()
        progressEntry1.value = 2.0
        progressEntry1.notes = "Good workout today"
        progressEntry1.dataSource = "manual"
        progressEntry1.timestamp = Date().addingTimeInterval(-86400) // Yesterday
        progressEntry1.goal = weightGoal
        
        let progressEntry2 = CDProgressEntry(context: viewContext)
        progressEntry2.id = UUID()
        progressEntry2.value = 3.0
        progressEntry2.notes = "Another pound down!"
        progressEntry2.dataSource = "manual"
        progressEntry2.timestamp = Date()
        progressEntry2.goal = weightGoal
        
        do {
            try viewContext.save()
        } catch {
            // Replace this implementation with code to handle the error appropriately.
            // fatalError() causes the application to generate a crash log and terminate. You should not use this function in a shipping application, although it may be useful during development.
            let nsError = error as NSError
            fatalError("Unresolved error \(nsError), \(nsError.userInfo)")
        }
        return result
    }()

    let container: NSPersistentContainer

    init(inMemory: Bool = false) {
        container = NSPersistentContainer(name: "iJarvis")
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
