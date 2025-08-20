//
//  JarvisTests.swift
//  JarvisTests
//
//  Created by Lorenzo Tomas Diez on 04/08/2025.
//

import XCTest
import SwiftUI
@testable import Jarvis

final class JarvisTests: XCTestCase {

    func testDashboardCardInitialization() throws {
        // Given
        let title = "Active Goals"
        let value = "12"
        let icon = "target"
        let color = Color.blue
        
        // When
        let card = DashboardCard(title: title, value: value, icon: icon, color: color)
        
        // Then
        XCTAssertEqual(card.title, title)
        XCTAssertEqual(card.value, value)
        XCTAssertEqual(card.icon, icon)
        XCTAssertEqual(card.color, color)
    }
    
    func testDashboardCardWithDifferentValues() throws {
        // Given
        let title = "Life Areas"
        let value = "8"
        let icon = "square.grid.3x3.fill"
        let color = Color.green
        
        // When
        let card = DashboardCard(title: title, value: value, icon: icon, color: color)
        
        // Then
        XCTAssertEqual(card.title, title)
        XCTAssertEqual(card.value, value)
        XCTAssertEqual(card.icon, icon)
        XCTAssertEqual(card.color, color)
    }
    
    func testLifeAreaCardInitialization() throws {
        // Given
        let name = "Health"
        let icon = "heart.fill"
        let color = Color.red
        
        // When
        let card = LifeAreaCard(name: name, icon: icon, color: color)
        
        // Then
        XCTAssertEqual(card.name, name)
        XCTAssertEqual(card.icon, icon)
        XCTAssertEqual(card.color, color)
    }
    
    func testGoalCardInitialization() throws {
        // Given
        let title = "Exercise 30 minutes daily"
        let progress = 0.7
        let type = "Habit"
        
        // When
        let card = GoalCard(title: title, progress: progress, type: type)
        
        // Then
        XCTAssertEqual(card.title, title)
        XCTAssertEqual(card.progress, progress)
        XCTAssertEqual(card.type, type)
    }
    
    func testProgressChartInitialization() throws {
        // Given
        let title = "Weekly Progress"
        let data = [0.6, 0.8, 0.7, 0.9, 0.8, 0.7, 0.8]
        
        // When
        let chart = ProgressChart(title: title, data: data)
        
        // Then
        XCTAssertEqual(chart.title, title)
        XCTAssertEqual(chart.data.count, 7)
        XCTAssertEqual(chart.data[0], 0.6)
        XCTAssertEqual(chart.data[6], 0.8)
    }
    
    func testChatBubbleInitialization() throws {
        // Given
        let message = "Hello! How can I help you today?"
        let isUser = false
        
        // When
        let bubble = ChatBubble(message: message, isUser: isUser)
        
        // Then
        XCTAssertEqual(bubble.message, message)
        XCTAssertEqual(bubble.isUser, isUser)
    }
}
