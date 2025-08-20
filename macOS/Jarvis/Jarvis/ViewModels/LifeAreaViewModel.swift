//
//  LifeAreaViewModel.swift
//  Jarvis
//
//  Created by Lorenzo Tomas Diez on 04/08/2025.
//

import Foundation
import CoreData
import SwiftUI

@MainActor
class LifeAreaViewModel: ObservableObject {
    @Published var lifeAreas: [LifeArea] = []
    @Published var isLoading = false
    @Published var errorMessage: String?
    
    private let viewContext: NSManagedObjectContext
    
    init(context: NSManagedObjectContext) {
        self.viewContext = context
        fetchLifeAreas()
    }
    
    // MARK: - CRUD Operations
    
    func fetchLifeAreas() {
        isLoading = true
        errorMessage = nil
        
        let request: NSFetchRequest<LifeArea> = LifeArea.fetchRequest()
        request.sortDescriptors = [NSSortDescriptor(keyPath: \LifeArea.name, ascending: true)]
        
        do {
            lifeAreas = try viewContext.fetch(request)
        } catch {
            errorMessage = "Failed to fetch life areas: \(error.localizedDescription)"
        }
        
        isLoading = false
    }
    
    func createLifeArea(name: String, icon: String, colorHex: String, description: String?) {
        let newLifeArea = LifeArea(context: viewContext)
        newLifeArea.id = UUID()
        newLifeArea.name = name
        newLifeArea.icon = icon
        newLifeArea.colorHex = colorHex
        newLifeArea.areaDescription = description
        newLifeArea.createdAt = Date()
        newLifeArea.updatedAt = Date()
        
        saveContext()
    }
    
    func updateLifeArea(_ lifeArea: LifeArea, name: String, icon: String, colorHex: String, description: String?) {
        lifeArea.name = name
        lifeArea.icon = icon
        lifeArea.colorHex = colorHex
        lifeArea.areaDescription = description
        lifeArea.updatedAt = Date()
        
        saveContext()
    }
    
    func deleteLifeArea(_ lifeArea: LifeArea) {
        viewContext.delete(lifeArea)
        saveContext()
    }
    
    // MARK: - Helper Methods
    
    private func saveContext() {
        do {
            try viewContext.save()
            fetchLifeAreas() // Refresh the list
        } catch {
            errorMessage = "Failed to save changes: \(error.localizedDescription)"
        }
    }
    
    func clearError() {
        errorMessage = nil
    }
    
    // MARK: - Validation
    
    func validateLifeArea(name: String, icon: String, colorHex: String) -> Bool {
        guard !name.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else {
            errorMessage = "Life area name cannot be empty"
            return false
        }
        
        guard !icon.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else {
            errorMessage = "Icon cannot be empty"
            return false
        }
        
        guard colorHex.hasPrefix("#") && colorHex.count == 7 else {
            errorMessage = "Color must be a valid hex color (e.g., #FF0000)"
            return false
        }
        
        return true
    }
}
