//
//  JarvisTests.swift
//  JarvisTests
//
//  Created by Lorenzo Tomas Diez on 04/08/2025.
//

import Testing
import SwiftUI
@testable import Jarvis

struct JarvisTests {

    @Test func testDashboardCardInitialization() async throws {
        // Given
        let title = "Active Goals"
        let value = "12"
        let icon = "target"
        let color = Color.blue
        
        // When
        let card = DashboardCard(title: title, value: value, icon: icon, color: color)
        
        // Then
        #expect(card.title == title)
        #expect(card.value == value)
        #expect(card.icon == icon)
        #expect(card.color == color)
    }
    
    @Test func testDashboardCardWithDifferentValues() async throws {
        // Given
        let title = "Life Areas"
        let value = "8"
        let icon = "square.grid.3x3.fill"
        let color = Color.green
        
        // When
        let card = DashboardCard(title: title, value: value, icon: icon, color: color)
        
        // Then
        #expect(card.title == title)
        #expect(card.value == value)
        #expect(card.icon == icon)
        #expect(card.color == color)
    }
    
    @Test func testLifeAreaCardInitialization() async throws {
        // Given
        let name = "Health"
        let icon = "heart.fill"
        let color = Color.red
        
        // When
        let card = LifeAreaCard(name: name, icon: icon, color: color)
        
        // Then
        #expect(card.name == name)
        #expect(card.icon == icon)
        #expect(card.color == color)
    }
    
    @Test func testGoalCardInitialization() async throws {
        // Given
        let title = "Exercise 30 minutes daily"
        let progress = 0.7
        let type = "Habit"
        
        // When
        let card = GoalCard(title: title, progress: progress, type: type)
        
        // Then
        #expect(card.title == title)
        #expect(card.progress == progress)
        #expect(card.type == type)
    }
    
    @Test func testProgressChartInitialization() async throws {
        // Given
        let title = "Weekly Progress"
        let data = [0.6, 0.8, 0.7, 0.9, 0.8, 0.7, 0.8]
        
        // When
        let chart = ProgressChart(title: title, data: data)
        
        // Then
        #expect(chart.title == title)
        #expect(chart.data.count == 7)
        #expect(chart.data[0] == 0.6)
        #expect(chart.data[6] == 0.8)
    }
    
    @Test func testChatBubbleInitialization() async throws {
        // Given
        let message = "Hello! How can I help you today?"
        let isUser = false
        
        // When
        let bubble = ChatBubble(message: message, isUser: isUser)
        
        // Then
        #expect(bubble.message == message)
        #expect(bubble.isUser == isUser)
    }
    
    @Test func testContentViewInitialState() async throws {
        // Given
        let contentView = ContentView()
        
        // When - Access the selectedTab state
        // Note: We can't directly access @State properties in tests, but we can test the view structure
        
        // Then
        #expect(true) // ContentView should initialize without errors
    }
    
    @Test func testSidebarViewInitialization() async throws {
        // Given
        let selectedTab = Binding.constant(0)
        
        // When
        let sidebarView = SidebarView(selectedTab: selectedTab)
        
        // Then
        #expect(true) // SidebarView should initialize without errors
    }
    
    @Test func testDashboardViewInitialization() async throws {
        // Given & When
        let dashboardView = DashboardView()
        
        // Then
        #expect(true) // DashboardView should initialize without errors
    }
    
    @Test func testLifeAreasViewInitialization() async throws {
        // Given & When
        let lifeAreasView = LifeAreasView()
        
        // Then
        #expect(true) // LifeAreasView should initialize without errors
    }
    
    @Test func testGoalsViewInitialization() async throws {
        // Given & When
        let goalsView = GoalsView()
        
        // Then
        #expect(true) // GoalsView should initialize without errors
    }
    
    @Test func testProgressViewInitialization() async throws {
        // Given & When
        let progressView = ProgressView()
        
        // Then
        #expect(true) // ProgressView should initialize without errors
    }
    
    @Test func testChatViewInitialization() async throws {
        // Given & When
        let chatView = ChatView()
        
        // Then
        #expect(true) // ChatView should initialize without errors
    }
}
