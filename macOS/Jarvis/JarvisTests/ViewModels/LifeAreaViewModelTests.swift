//
//  LifeAreaViewModelTests.swift
//  JarvisTests
//
//  Created by Lorenzo Tomas Diez on 04/08/2025.
//

import XCTest
import CoreData
import SwiftUI
@testable import Jarvis

@MainActor
final class LifeAreaViewModelTests: XCTestCase {
    var viewModel: LifeAreaViewModel!
    var context: NSManagedObjectContext!
    var container: NSPersistentContainer!
    
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
        viewModel = LifeAreaViewModel(context: context)
    }
    
    override func tearDownWithError() throws {
        viewModel = nil
        context = nil
        container = nil
    }
    
    // MARK: - CRUD Operations Tests
    
    func testCreateLifeArea() async throws {
        // Given
        let name = "Health & Fitness"
        let icon = "heart.fill"
        let colorHex = "#FF0000"
        let description = "Physical and mental well-being"
        
        // When
        viewModel.createLifeArea(name: name, icon: icon, colorHex: colorHex, description: description)
        
        // Then
        XCTAssertEqual(viewModel.lifeAreas.count, 1)
        XCTAssertEqual(viewModel.lifeAreas.first?.name, name)
        XCTAssertEqual(viewModel.lifeAreas.first?.icon, icon)
        XCTAssertEqual(viewModel.lifeAreas.first?.colorHex, colorHex)
        XCTAssertEqual(viewModel.lifeAreas.first?.areaDescription, description)
        XCTAssertNotNil(viewModel.lifeAreas.first?.id)
        XCTAssertNotNil(viewModel.lifeAreas.first?.createdAt)
        XCTAssertNotNil(viewModel.lifeAreas.first?.updatedAt)
    }
    
    func testUpdateLifeArea() async throws {
        // Given
        let originalName = "Health"
        let updatedName = "Health & Wellness"
        let icon = "heart.fill"
        let colorHex = "#FF0000"
        
        viewModel.createLifeArea(name: originalName, icon: icon, colorHex: colorHex, description: nil)
        let lifeArea = viewModel.lifeAreas.first!
        
        // When
        viewModel.updateLifeArea(lifeArea, name: updatedName, icon: icon, colorHex: colorHex, description: "Updated description")
        
        // Then
        XCTAssertEqual(viewModel.lifeAreas.first?.name, updatedName)
        XCTAssertEqual(viewModel.lifeAreas.first?.areaDescription, "Updated description")
        XCTAssertNotEqual(viewModel.lifeAreas.first?.updatedAt, lifeArea.createdAt)
    }
    
    func testDeleteLifeArea() async throws {
        // Given
        viewModel.createLifeArea(name: "Test Area", icon: "star.fill", colorHex: "#0000FF", description: nil)
        XCTAssertEqual(viewModel.lifeAreas.count, 1)
        
        let lifeArea = viewModel.lifeAreas.first!
        
        // When
        viewModel.deleteLifeArea(lifeArea)
        
        // Then
        XCTAssertEqual(viewModel.lifeAreas.count, 0)
    }
    
    func testFetchLifeAreas() async throws {
        // Given
        viewModel.createLifeArea(name: "Area 1", icon: "star.fill", colorHex: "#FF0000", description: nil)
        viewModel.createLifeArea(name: "Area 2", icon: "heart.fill", colorHex: "#00FF00", description: nil)
        
        // When
        viewModel.fetchLifeAreas()
        
        // Then
        XCTAssertEqual(viewModel.lifeAreas.count, 2)
        XCTAssertEqual(viewModel.lifeAreas.first?.name, "Area 1") // Should be sorted alphabetically
        XCTAssertEqual(viewModel.lifeAreas.last?.name, "Area 2")
    }
    
    // MARK: - Validation Tests
    
    func testValidateLifeAreaWithValidData() async throws {
        // Given
        let name = "Valid Area"
        let icon = "star.fill"
        let colorHex = "#FF0000"
        
        // When
        let isValid = viewModel.validateLifeArea(name: name, icon: icon, colorHex: colorHex)
        
        // Then
        XCTAssertTrue(isValid)
        XCTAssertNil(viewModel.errorMessage)
    }
    
    func testValidateLifeAreaWithEmptyName() async throws {
        // Given
        let name = ""
        let icon = "star.fill"
        let colorHex = "#FF0000"
        
        // When
        let isValid = viewModel.validateLifeArea(name: name, icon: icon, colorHex: colorHex)
        
        // Then
        XCTAssertFalse(isValid)
        XCTAssertEqual(viewModel.errorMessage, "Life area name cannot be empty")
    }
    
    func testValidateLifeAreaWithEmptyIcon() async throws {
        // Given
        let name = "Valid Area"
        let icon = ""
        let colorHex = "#FF0000"
        
        // When
        let isValid = viewModel.validateLifeArea(name: name, icon: icon, colorHex: colorHex)
        
        // Then
        XCTAssertFalse(isValid)
        XCTAssertEqual(viewModel.errorMessage, "Icon cannot be empty")
    }
    
    func testValidateLifeAreaWithInvalidColor() async throws {
        // Given
        let name = "Valid Area"
        let icon = "star.fill"
        let colorHex = "FF0000" // Missing #
        
        // When
        let isValid = viewModel.validateLifeArea(name: name, icon: icon, colorHex: colorHex)
        
        // Then
        XCTAssertFalse(isValid)
        XCTAssertEqual(viewModel.errorMessage, "Color must be a valid hex color (e.g., #FF0000)")
    }
    
    func testValidateLifeAreaWithInvalidColorLength() async throws {
        // Given
        let name = "Valid Area"
        let icon = "star.fill"
        let colorHex = "#FF00" // Too short
        
        // When
        let isValid = viewModel.validateLifeArea(name: name, icon: icon, colorHex: colorHex)
        
        // Then
        XCTAssertFalse(isValid)
        XCTAssertEqual(viewModel.errorMessage, "Color must be a valid hex color (e.g., #FF0000)")
    }
    
    // MARK: - Error Handling Tests
    
    func testClearError() async throws {
        // Given
        viewModel.errorMessage = "Test error message"
        
        // When
        viewModel.clearError()
        
        // Then
        XCTAssertNil(viewModel.errorMessage)
    }
    
    // MARK: - Loading State Tests
    
    func testLoadingStateDuringFetch() async throws {
        // Given
        viewModel.isLoading = false
        
        // When
        viewModel.fetchLifeAreas()
        
        // Then
        // Note: Since we're using in-memory store, this might be too fast to catch
        // In a real scenario with network calls, this would be more meaningful
        XCTAssertFalse(viewModel.isLoading) // Should be false after fetch completes
    }
}
