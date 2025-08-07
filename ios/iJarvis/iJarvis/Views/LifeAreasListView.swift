//
//  LifeAreasListView.swift
//  iJarvis
//
//  Created by Lorenzo Tomas Diez on 07/08/2025.
//

import SwiftUI
import CoreData

struct LifeAreasListView: View {
    @Environment(\.managedObjectContext) private var viewContext
    @State private var lifeAreas: [CDLifeArea] = []
    @State private var isLoading = false
    @State private var errorMessage: String?
    @State private var showingAddSheet = false
    
    var body: some View {
        List {
            if isLoading {
                ProgressView("Loading...")
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
            } else if lifeAreas.isEmpty {
                VStack {
                    Image(systemName: "tray")
                        .font(.system(size: 50))
                        .foregroundColor(.secondary)
                    Text("No Life Areas")
                        .font(.headline)
                        .foregroundColor(.secondary)
                    Text("Tap the + button to add your first life area")
                        .font(.caption)
                        .foregroundColor(.secondary)
                        .multilineTextAlignment(.center)
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity)
                .listRowBackground(Color.clear)
            } else {
                ForEach(lifeAreas) { lifeArea in
                    LifeAreaRowView(lifeArea: lifeArea)
                        .swipeActions(edge: .trailing) {
                            Button("Delete", role: .destructive) {
                                deleteLifeArea(lifeArea)
                            }
                        }
                }
            }
        }
        .navigationTitle("Life Areas")
        .toolbar {
            ToolbarItem(placement: .navigationBarTrailing) {
                Button("Add") {
                    showingAddSheet = true
                }
            }
        }
        .sheet(isPresented: $showingAddSheet) {
            AddLifeAreaView { name, type, color, icon in
                await createLifeArea(name: name, type: type, color: color, icon: icon)
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
            await loadLifeAreas()
        }
    }
    
    private func loadLifeAreas() async {
        isLoading = true
        do {
            lifeAreas = try await CoreDataManager.shared.fetchAllLifeAreas(context: viewContext)
        } catch {
            errorMessage = "Failed to load life areas: \(error.localizedDescription)"
        }
        isLoading = false
    }
    
    private func createLifeArea(name: String, type: String, color: String?, icon: String?) async {
        do {
            let newLifeArea = try await CoreDataManager.shared.createLifeArea(
                name: name,
                type: type,
                color: color,
                icon: icon,
                context: viewContext
            )
            lifeAreas.append(newLifeArea)
        } catch {
            errorMessage = "Failed to create life area: \(error.localizedDescription)"
        }
    }
    
    private func deleteLifeArea(_ lifeArea: CDLifeArea) {
        Task {
            do {
                try await CoreDataManager.shared.deleteLifeArea(id: lifeArea.id!, context: viewContext)
                await loadLifeAreas()
            } catch {
                errorMessage = "Failed to delete life area: \(error.localizedDescription)"
            }
        }
    }
}

struct LifeAreaRowView: View {
    let lifeArea: CDLifeArea
    
    var body: some View {
        HStack {
            Image(systemName: iconName)
                .foregroundColor(iconColor)
                .frame(width: 30)
            
            VStack(alignment: .leading) {
                Text(lifeArea.name ?? "Unknown")
                    .font(.headline)
                Text((lifeArea.type ?? "unknown").capitalized)
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            
            Spacer()
            
            if lifeArea.isActive {
                Image(systemName: "checkmark.circle.fill")
                    .foregroundColor(.green)
            }
        }
        .padding(.vertical, 4)
    }
    
    private var iconName: String {
        guard let type = lifeArea.type else { return "questionmark.circle" }
        
        switch type {
        case "health":
            return "heart.fill"
        case "finance":
            return "dollarsign.circle.fill"
        case "learning":
            return "book.fill"
        case "work":
            return "briefcase.fill"
        case "goals":
            return "target"
        case "productivity":
            return "bolt.fill"
        default:
            return "questionmark.circle"
        }
    }
    
    private var iconColor: Color {
        if let colorString = lifeArea.color, let color = Color(hex: colorString) {
            return color
        }
        return .accentColor
    }
}

struct AddLifeAreaView: View {
    @Environment(\.dismiss) private var dismiss
    @State private var name = ""
    @State private var selectedType = "health"
    @State private var color = "#007AFF"
    @State private var icon = "heart.fill"
    
    let onSave: (String, String, String?, String?) async -> Void
    
    private let lifeAreaTypes = [
        ("health", "Health"),
        ("finance", "Finance"),
        ("learning", "Learning"),
        ("work", "Work"),
        ("goals", "Goals"),
        ("productivity", "Productivity")
    ]
    
    var body: some View {
        NavigationView {
            Form {
                Section("Life Area Details") {
                    TextField("Name", text: $name)
                    
                    Picker("Type", selection: $selectedType) {
                        ForEach(lifeAreaTypes, id: \.0) { type, displayName in
                            Text(displayName).tag(type)
                        }
                    }
                    
                    ColorPicker("Color", selection: .constant(.blue))
                    
                    TextField("Icon", text: $icon)
                }
            }
            .navigationTitle("Add Life Area")
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
                            await onSave(name, selectedType, color, icon)
                            dismiss()
                        }
                    }
                    .disabled(name.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
                }
            }
        }
    }
}

extension Color {
    init?(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)
        let a, r, g, b: UInt64
        switch hex.count {
        case 3: // RGB (12-bit)
            (a, r, g, b) = (255, (int >> 8) * 17, (int >> 4 & 0xF) * 17, (int & 0xF) * 17)
        case 6: // RGB (24-bit)
            (a, r, g, b) = (255, int >> 16, int >> 8 & 0xFF, int & 0xFF)
        case 8: // ARGB (32-bit)
            (a, r, g, b) = (int >> 24, int >> 16 & 0xFF, int >> 8 & 0xFF, int & 0xFF)
        default:
            return nil
        }
        
        self.init(
            .sRGB,
            red: Double(r) / 255,
            green: Double(g) / 255,
            blue:  Double(b) / 255,
            opacity: Double(a) / 255
        )
    }
}

#Preview {
    NavigationView {
        LifeAreasListView()
            .environment(\.managedObjectContext, PersistenceController.preview.container.viewContext)
    }
} 