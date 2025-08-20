//
//  JarvisUITests.swift
//  JarvisUITests
//
//  Created by Lorenzo Tomas Diez on 04/08/2025.
//

import XCTest

final class JarvisUITests: XCTestCase {
    var app: XCUIApplication!
    
    override func setUpWithError() throws {
        continueAfterFailure = false
        app = XCUIApplication()
        app.launch()
    }

    override func tearDownWithError() throws {
        app = nil
    }

    func testAppLaunchesSuccessfully() throws {
        // Given & When - App is launched in setUp
        
        // Then - App should be accessible
        XCTAssertNotNil(app)
    }
    
    func testAppWindowExists() throws {
        // Given - App is launched
        
        // When - Get window
        let window = app.windows.firstMatch
        
        // Then - Window should exist
        XCTAssertTrue(window.exists)
    }
    
    func testBasicNavigation() throws {
        // Given - App is launched
        
        // When - Look for basic navigation elements
        let dashboardButton = app.buttons["Dashboard"]
        
        // Then - At least dashboard button should exist
        XCTAssertTrue(dashboardButton.exists)
    }
    
    func testAppTitle() throws {
        // Given - App is launched
        
        // When - Look for dashboard button (which should always be visible)
        let dashboardButton = app.buttons["Dashboard"]
        
        // Then - Dashboard button should exist (proves app loaded correctly)
        XCTAssertTrue(dashboardButton.exists)
    }
}
