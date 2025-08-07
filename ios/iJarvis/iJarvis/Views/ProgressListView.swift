//
//  ProgressListView.swift
//  iJarvis
//
//  Created by Lorenzo Tomas Diez on 07/08/2025.
//

import SwiftUI
import CoreData

struct ProgressListView: View {
    @Environment(\.managedObjectContext) private var viewContext
    @State private var progressEntries: [CDProgressEntry] = []
    @State private var isLoading = false
    @State private var errorMessage: String?
    @State private var showingAddSheet = false
    @State private var selectedGoalId: UUID?
    @State private var goals: [CDGoal] = []
    
    var body: some View {
        List {
            if isLoading {
                ProgressView("Loading...")
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
            } else if progressEntries.isEmpty {
                VStack {
                    Image(systemName: "chart.line.uptrend.xyaxis")
                        .font(.system(size: 50))
                        .foregroundColor(.secondary)
                    Text("No Progress Entries")
                        .font(.headline)
                        .foregroundColor(.secondary)
                    Text("Tap the + button to add your first progress entry")
                        .font(.caption)
                        .foregroundColor(.secondary)
                        .multilineTextAlignment(.center)
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity)
                .listRowBackground(Color.clear)
            } else {
                ForEach(progressEntries) { entry in
                    ProgressEntryRowView(entry: entry)
                        .swipeActions(edge: .trailing) {
                            Button("Delete", role: .destructive) {
                                deleteProgressEntry(entry)
                            }
                        }
                }
            }
        }
        .navigationTitle("Progress")
        .toolbar {
            ToolbarItem(placement: .navigationBarTrailing) {
                Button("Add") {
                    showingAddSheet = true
                }
            }
        }
        .sheet(isPresented: $showingAddSheet) {
            AddProgressEntryView { goalId, value, notes, dataSource in
                await createProgressEntry(goalId: goalId, value: value, notes: notes, dataSource: dataSource)
            }
        }
        .alert("Error", isPresented: .constant(errorMessage != nil)) {
            Button("OK") {
                errorMessage = nil
            }
        } message: {
            Text(errorMessage ?? "")
        }
        .task {
            await loadGoals()
            await loadProgressEntries()
        }
    }
    
    private func loadGoals() async {
        do {
            goals = try await CoreDataManager.shared.fetchAllGoals(context: viewContext)
        } catch {
            errorMessage = "Failed to load goals: \(error.localizedDescription)"
        }
    }
    
    private func loadProgressEntries() async {
        isLoading = true
        do {
            if let goalId = selectedGoalId {
                progressEntries = try await CoreDataManager.shared.fetchProgressEntriesByGoal(goalId: goalId, context: viewContext)
            } else {
                // For now, load all progress entries. In a real app, you might want to implement pagination
                progressEntries = try await CoreDataManager.shared.fetchAllProgressEntries(context: viewContext)
            }
        } catch {
            errorMessage = "Failed to load progress entries: \(error.localizedDescription)"
        }
        isLoading = false
    }
    
    private func createProgressEntry(goalId: UUID, value: Double, notes: String?, dataSource: String) async {
        do {
            let newEntry = try await CoreDataManager.shared.createProgressEntry(
                goalId: goalId,
                value: value,
                notes: notes,
                dataSource: dataSource,
                context: viewContext
            )
            progressEntries.append(newEntry)
        } catch {
            errorMessage = "Failed to create progress entry: \(error.localizedDescription)"
        }
    }
    
    private func deleteProgressEntry(_ entry: CDProgressEntry) {
        Task {
            do {
                try await CoreDataManager.shared.deleteProgressEntry(id: entry.id!, context: viewContext)
                await loadProgressEntries()
            } catch {
                errorMessage = "Failed to delete progress entry: \(error.localizedDescription)"
            }
        }
    }
}

struct ProgressEntryRowView: View {
    let entry: CDProgressEntry
    
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                VStack(alignment: .leading) {
                    Text("\(entry.value, specifier: "%.1f")")
                        .font(.headline)
                    
                    if let notes = entry.notes {
                        Text(notes)
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                    
                    if let goal = entry.goal, let goalTitle = goal.title {
                        Text("Goal: \(goalTitle)")
                            .font(.caption2)
                            .foregroundColor(.secondary)
                    }
                }
                
                Spacer()
                
                VStack(alignment: .trailing) {
                    Text(dataSourceIcon)
                        .font(.caption)
                        .foregroundColor(dataSourceColor)
                    
                    Text((entry.dataSource ?? "unknown").capitalized)
                        .font(.caption2)
                        .foregroundColor(.secondary)
                    
                    if let timestamp = entry.timestamp {
                        Text(timestamp, style: .date)
                            .font(.caption2)
                            .foregroundColor(.secondary)
                    }
                }
            }
        }
        .padding(.vertical, 4)
    }
    
    private var dataSourceIcon: String {
        guard let dataSource = entry.dataSource else { return "questionmark.circle" }
        
        switch dataSource {
        case "manual":
            return "hand.point.up"
        case "appleHealth":
            return "heart.fill"
        case "calendar":
            return "calendar"
        case "reminders":
            return "checklist"
        case "api":
            return "network"
        case "ai":
            return "brain.head.profile"
        case "fileImport":
            return "doc.fill"
        default:
            return "questionmark.circle"
        }
    }
    
    private var dataSourceColor: Color {
        guard let dataSource = entry.dataSource else { return .gray }
        
        switch dataSource {
        case "manual":
            return .blue
        case "appleHealth":
            return .green
        case "calendar":
            return .orange
        case "reminders":
            return .purple
        case "api":
            return .cyan
        case "ai":
            return .indigo
        case "fileImport":
            return .gray
        default:
            return .gray
        }
    }
}

struct AddProgressEntryView: View {
    @Environment(\.dismiss) private var dismiss
    @Environment(\.managedObjectContext) private var viewContext
    @State private var selectedGoalId: UUID?
    @State private var value = 0.0
    @State private var notes = ""
    @State private var selectedDataSource = "manual"
    @State private var goals: [CDGoal] = []
    
    let onSave: (UUID, Double, String?, String) async -> Void
    
    private let dataSources = [
        ("manual", "Manual"),
        ("appleHealth", "Apple Health"),
        ("calendar", "Calendar"),
        ("reminders", "Reminders"),
        ("api", "API"),
        ("ai", "AI"),
        ("fileImport", "File Import")
    ]
    
    var body: some View {
        NavigationView {
            Form {
                Section("Progress Details") {
                    Picker("Goal", selection: $selectedGoalId) {
                        Text("Select a goal").tag(nil as UUID?)
                        ForEach(goals) { goal in
                            Text(goal.title ?? "Unknown Goal").tag(goal.id as UUID?)
                        }
                    }
                    
                    HStack {
                        Text("Value")
                        Spacer()
                        TextField("0.0", value: $value, format: .number)
                            .keyboardType(.decimalPad)
                            .multilineTextAlignment(.trailing)
                    }
                    
                    TextField("Notes (Optional)", text: $notes, axis: .vertical)
                        .lineLimit(3...6)
                }
                
                Section("Data Source") {
                    Picker("Source", selection: $selectedDataSource) {
                        ForEach(dataSources, id: \.0) { source, displayName in
                            Text(displayName).tag(source)
                        }
                    }
                }
            }
            .navigationTitle("Add Progress")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") {
                        dismiss()
                    }
                }
                
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Save") {
                        Task {
                            if let goalId = selectedGoalId {
                                await onSave(goalId, value, notes.isEmpty ? nil : notes, selectedDataSource)
                                dismiss()
                            }
                        }
                    }
                    .disabled(selectedGoalId == nil)
                }
            }
            .task {
                await loadGoals()
            }
        }
    }
    
    private func loadGoals() async {
        do {
            goals = try await CoreDataManager.shared.fetchAllGoals(context: viewContext)
        } catch {
            // Handle error silently for now
        }
    }
}

#Preview {
    NavigationView {
        ProgressListView()
            .environment(\.managedObjectContext, PersistenceController.preview.container.viewContext)
    }
} 