//
//  GoalsListView.swift
//  iJarvis
//
//  Created by Lorenzo Tomas Diez on 07/08/2025.
//

import SwiftUI
import CoreData

struct GoalsListView: View {
    @Environment(\.managedObjectContext) private var viewContext
    @State private var goals: [CDGoal] = []
    @State private var searchText = ""
    @State private var isLoading = false
    @State private var errorMessage: String?
    @State private var showingAddSheet = false
    @State private var selectedLifeAreaId: UUID?
    
    var filteredGoals: [CDGoal] {
        if searchText.isEmpty {
            return goals
        } else {
            return goals.filter { goal in
                guard let title = goal.title else { return false }
                return title.localizedCaseInsensitiveContains(searchText)
            }
        }
    }
    
    var body: some View {
        List {
            if isLoading {
                ProgressView("Loading...")
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
            } else if filteredGoals.isEmpty {
                VStack {
                    Image(systemName: "target")
                        .font(.system(size: 50))
                        .foregroundColor(.secondary)
                    Text(searchText.isEmpty ? "No Goals" : "No matching goals")
                        .font(.headline)
                        .foregroundColor(.secondary)
                    Text(searchText.isEmpty ? "Tap the + button to add your first goal" : "Try adjusting your search")
                        .font(.caption)
                        .foregroundColor(.secondary)
                        .multilineTextAlignment(.center)
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity)
                .listRowBackground(Color.clear)
            } else {
                ForEach(filteredGoals) { goal in
                    GoalListItemView(goal: goal)
                        .swipeActions(edge: .trailing) {
                            Button("Delete", role: .destructive) {
                                deleteGoal(goal)
                            }
                        }
                }
            }
        }
        .navigationTitle("Goals")
        .searchable(text: $searchText, prompt: "Search goals")
        .toolbar {
            ToolbarItem(placement: .navigationBarTrailing) {
                Button("Add") {
                    showingAddSheet = true
                }
            }
        }
        .sheet(isPresented: $showingAddSheet) {
            AddGoalView { title, type, lifeAreaId, targetValue in
                await createGoal(title: title, type: type, lifeAreaId: lifeAreaId, targetValue: targetValue)
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
        }
    }
    
    private func loadGoals() async {
        isLoading = true
        do {
            if let lifeAreaId = selectedLifeAreaId {
                goals = try await CoreDataManager.shared.fetchGoalsByLifeArea(lifeAreaId: lifeAreaId, context: viewContext)
            } else {
                // For now, load all goals. In a real app, you might want to implement pagination
                goals = try await CoreDataManager.shared.fetchAllGoals(context: viewContext)
            }
        } catch {
            errorMessage = "Failed to load goals: \(error.localizedDescription)"
        }
        isLoading = false
    }
    
    private func createGoal(title: String, type: String, lifeAreaId: UUID?, targetValue: Double) async {
        do {
            let newGoal = try await CoreDataManager.shared.createGoal(
                title: title,
                type: type,
                lifeAreaId: lifeAreaId,
                targetValue: targetValue,
                context: viewContext
            )
            goals.append(newGoal)
        } catch {
            errorMessage = "Failed to create goal: \(error.localizedDescription)"
        }
    }
    
    private func deleteGoal(_ goal: CDGoal) {
        Task {
            do {
                try await CoreDataManager.shared.deleteGoal(id: goal.id!, context: viewContext)
                await loadGoals()
            } catch {
                errorMessage = "Failed to delete goal: \(error.localizedDescription)"
            }
        }
    }
}

struct GoalListItemView: View {
    let goal: CDGoal
    
    var progressPercentage: Double {
        guard goal.targetValue > 0 else { return 0 }
        return (goal.currentValue / goal.targetValue) * 100
    }
    
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                VStack(alignment: .leading) {
                    Text(goal.title ?? "Unknown Goal")
                        .font(.headline)
                    Text((goal.type ?? "unknown").capitalized)
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
                
                Spacer()
                
                VStack(alignment: .trailing) {
                    Text("\(Int(progressPercentage))%")
                        .font(.caption)
                        .foregroundColor(.secondary)
                    
                    if goal.type == "numeric" {
                        Text("\(goal.currentValue, specifier: "%.1f") / \(goal.targetValue, specifier: "%.1f")")
                            .font(.caption2)
                            .foregroundColor(.secondary)
                    }
                }
            }
            
            if goal.type == "numeric" {
                ProgressView(value: min(progressPercentage / 100, 1.0))
                    .progressViewStyle(LinearProgressViewStyle())
            }
        }
        .padding(.vertical, 4)
    }
}

struct AddGoalView: View {
    @Environment(\.dismiss) private var dismiss
    @Environment(\.managedObjectContext) private var viewContext
    @State private var title = ""
    @State private var selectedType = "numeric"
    @State private var selectedLifeAreaId: UUID?
    @State private var targetValue = 0.0
    @State private var lifeAreas: [CDLifeArea] = []
    
    let onSave: (String, String, UUID?, Double) async -> Void
    
    private let goalTypes = [
        ("numeric", "Numeric"),
        ("habit", "Habit"),
        ("milestone", "Milestone"),
        ("binary", "Binary"),
        ("custom", "Custom")
    ]
    
    var body: some View {
        NavigationView {
            Form {
                Section("Goal Details") {
                    TextField("Title", text: $title)
                    
                    Picker("Type", selection: $selectedType) {
                        ForEach(goalTypes, id: \.0) { type, displayName in
                            Text(displayName).tag(type)
                        }
                    }
                    
                    if selectedType == "numeric" {
                        HStack {
                            Text("Target Value")
                            Spacer()
                            TextField("0.0", value: $targetValue, format: .number)
                                .keyboardType(.decimalPad)
                                .multilineTextAlignment(.trailing)
                        }
                    }
                }
                
                Section("Life Area (Optional)") {
                    Picker("Life Area", selection: $selectedLifeAreaId) {
                        Text("None").tag(nil as UUID?)
                        ForEach(lifeAreas) { lifeArea in
                            Text(lifeArea.name ?? "Unknown").tag(lifeArea.id as UUID?)
                        }
                    }
                }
            }
            .navigationTitle("Add Goal")
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
                            await onSave(title, selectedType, selectedLifeAreaId, targetValue)
                            dismiss()
                        }
                    }
                    .disabled(title.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
                }
            }
            .task {
                await loadLifeAreas()
            }
        }
    }
    
    private func loadLifeAreas() async {
        do {
            lifeAreas = try await CoreDataManager.shared.fetchAllLifeAreas(context: viewContext)
        } catch {
            // Handle error silently for now
        }
    }
}

#Preview {
    NavigationView {
        GoalsListView()
            .environment(\.managedObjectContext, PersistenceController.preview.container.viewContext)
    }
} 