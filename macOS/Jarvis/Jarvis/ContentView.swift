//
//  ContentView.swift
//  Jarvis
//
//  Created by Lorenzo Tomas Diez on 04/08/2025.
//

import SwiftUI
import AppKit

struct ContentView: View {
    @State private var selectedTab = 0
    
    var body: some View {
        NavigationSplitView {
            SidebarView(selectedTab: $selectedTab)
        } detail: {
            switch selectedTab {
            case 0:
                DashboardView()
            case 1:
                LifeAreasView()
            case 2:
                GoalsView()
            case 3:
                ProgressTrackingView()
            case 4:
                ChatView()
            default:
                DashboardView()
            }
        }
        .frame(minWidth: 800, minHeight: 600)
        .navigationTitle("Jarvis")
    }
}

struct SidebarView: View {
    @Binding var selectedTab: Int
    
    var body: some View {
        List {
            Button(action: { selectedTab = 0 }) {
                Label("Dashboard", systemImage: "chart.bar.fill")
            }
            .buttonStyle(PlainButtonStyle())
            
            Button(action: { selectedTab = 1 }) {
                Label("Life Areas", systemImage: "square.grid.3x3.fill")
            }
            .buttonStyle(PlainButtonStyle())
            
            Button(action: { selectedTab = 2 }) {
                Label("Goals", systemImage: "target")
            }
            .buttonStyle(PlainButtonStyle())
            
            Button(action: { selectedTab = 3 }) {
                Label("Progress", systemImage: "chart.line.uptrend.xyaxis")
            }
            .buttonStyle(PlainButtonStyle())
            
            Button(action: { selectedTab = 4 }) {
                Label("Jarvis Chat", systemImage: "message.fill")
            }
            .buttonStyle(PlainButtonStyle())
        }
        .listStyle(SidebarListStyle())
        .frame(minWidth: 200)
    }
}

struct DashboardView: View {
    var body: some View {
        VStack(spacing: 20) {
            Text("Dashboard")
                .font(.largeTitle)
                .fontWeight(.bold)
            
            Text("Welcome to Jarvis - Your Personal Life Management System")
                .font(.title2)
                .foregroundColor(.secondary)
            
            // Dashboard cards
            LazyVGrid(columns: [
                GridItem(.flexible()),
                GridItem(.flexible()),
                GridItem(.flexible())
            ], spacing: 20) {
                DashboardCard(title: "Active Goals", value: "12", icon: "target", color: .blue)
                DashboardCard(title: "Life Areas", value: "8", icon: "square.grid.3x3.fill", color: .green)
                DashboardCard(title: "Progress Today", value: "85%", icon: "chart.line.uptrend.xyaxis", color: .orange)
            }
            .padding()
            
            Spacer()
        }
        .padding()
    }
}

struct DashboardCard: View {
    let title: String
    let value: String
    let icon: String
    let color: Color
    
    var body: some View {
        HStack {
            Image(systemName: icon)
                .font(.title2)
                .foregroundColor(color)
                .frame(width: 40)
            
            VStack(alignment: .leading) {
                Text(title)
                    .font(.headline)
                Text(value)
                    .font(.title)
                    .fontWeight(.bold)
            }
            
            Spacer()
        }
        .padding()
        .background(Color(NSColor.controlBackgroundColor))
        .cornerRadius(10)
    }
}

struct LifeAreasView: View {
    var body: some View {
        VStack {
            Text("Life Areas")
                .font(.largeTitle)
                .fontWeight(.bold)
            
            Text("Manage your life areas and priorities")
                .font(.title2)
                .foregroundColor(.secondary)
            
            // Placeholder for life areas grid
            LazyVGrid(columns: [
                GridItem(.flexible()),
                GridItem(.flexible())
            ], spacing: 20) {
                LifeAreaCard(name: "Health", icon: "heart.fill", color: .red)
                LifeAreaCard(name: "Finance", icon: "dollarsign.circle.fill", color: .green)
                LifeAreaCard(name: "Learning", icon: "book.fill", color: .blue)
                LifeAreaCard(name: "Relationships", icon: "person.2.fill", color: .purple)
            }
            .padding()
            
            Spacer()
        }
        .padding()
    }
}

struct LifeAreaCard: View {
    let name: String
    let icon: String
    let color: Color
    
    var body: some View {
        VStack {
            Image(systemName: icon)
                .font(.largeTitle)
                .foregroundColor(color)
            
            Text(name)
                .font(.headline)
                .fontWeight(.semibold)
        }
        .frame(height: 120)
        .frame(maxWidth: .infinity)
        .background(Color(NSColor.controlBackgroundColor))
        .cornerRadius(10)
    }
}

struct GoalsView: View {
    var body: some View {
        VStack {
            Text("Goals")
                .font(.largeTitle)
                .fontWeight(.bold)
            
            Text("Track your goals and progress")
                .font(.title2)
                .foregroundColor(.secondary)
            
            // Placeholder for goals list
            VStack(spacing: 16) {
                GoalCard(title: "Exercise 30 minutes daily", progress: 0.7, type: "Habit")
                GoalCard(title: "Read 20 books this year", progress: 0.4, type: "Numeric")
                GoalCard(title: "Save $10,000", progress: 0.6, type: "Numeric")
            }
            .padding()
            
            Spacer()
        }
        .padding()
    }
}

struct GoalCard: View {
    let title: String
    let progress: Double
    let type: String
    
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Text(title)
                    .font(.headline)
                Spacer()
                Text(type)
                    .font(.caption)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 4)
                    .background(Color.blue.opacity(0.2))
                    .cornerRadius(4)
            }
            
            ProgressView(value: progress)
                .progressViewStyle(LinearProgressViewStyle())
            
            Text("\(Int(progress * 100))% Complete")
                .font(.caption)
                .foregroundColor(.secondary)
        }
        .padding()
        .background(Color(NSColor.controlBackgroundColor))
        .cornerRadius(10)
    }
}

struct ProgressTrackingView: View {
    var body: some View {
        VStack {
            Text("Progress")
                .font(.largeTitle)
                .fontWeight(.bold)
            
            Text("Monitor your progress and achievements")
                .font(.title2)
                .foregroundColor(.secondary)
            
            // Placeholder for progress charts
            VStack(spacing: 20) {
                ProgressChart(title: "Weekly Progress", data: [0.6, 0.8, 0.7, 0.9, 0.8, 0.7, 0.8])
                ProgressChart(title: "Monthly Trends", data: [0.5, 0.6, 0.7, 0.8])
            }
            .padding()
            
            Spacer()
        }
        .padding()
    }
}

struct ProgressChart: View {
    let title: String
    let data: [Double]
    
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(title)
                .font(.headline)
            
            HStack(alignment: .bottom, spacing: 4) {
                ForEach(Array(data.enumerated()), id: \.offset) { index, value in
                    VStack {
                        Rectangle()
                            .fill(Color.blue)
                            .frame(width: 20, height: CGFloat(value * 100))
                        
                        Text("\(index + 1)")
                            .font(.caption)
                    }
                }
            }
            .frame(height: 120)
        }
        .padding()
        .background(Color(NSColor.controlBackgroundColor))
        .cornerRadius(10)
    }
}

struct ChatView: View {
    @State private var messageText = ""
    
    var body: some View {
        VStack {
            Text("Jarvis Chat")
                .font(.largeTitle)
                .fontWeight(.bold)
            
            Text("Chat with your AI assistant")
                .font(.title2)
                .foregroundColor(.secondary)
            
            // Placeholder for chat interface
            VStack {
                ScrollView {
                    VStack(alignment: .leading, spacing: 12) {
                        ChatBubble(message: "Hello! How can I help you today?", isUser: false)
                        ChatBubble(message: "I want to improve my productivity", isUser: true)
                        ChatBubble(message: "Great! Let's start by reviewing your current goals and life areas.", isUser: false)
                    }
                    .padding()
                }
                .frame(maxHeight: 400)
                .background(Color(NSColor.controlBackgroundColor))
                .cornerRadius(10)
                
                HStack {
                    TextField("Type your message...", text: $messageText)
                        .textFieldStyle(RoundedBorderTextFieldStyle())
                    
                    Button("Send") {
                        // Send message
                    }
                    .buttonStyle(.borderedProminent)
                }
                .padding()
            }
            .padding()
            
            Spacer()
        }
        .padding()
    }
}

struct ChatBubble: View {
    let message: String
    let isUser: Bool
    
    var body: some View {
        HStack {
            if isUser { Spacer() }
            
            Text(message)
                .padding()
                .background(isUser ? Color.blue : Color(NSColor.controlColor))
                .foregroundColor(isUser ? .white : .primary)
                .cornerRadius(16)
                .frame(maxWidth: 300, alignment: isUser ? .trailing : .leading)
            
            if !isUser { Spacer() }
        }
    }
}

#Preview {
    ContentView()
}
