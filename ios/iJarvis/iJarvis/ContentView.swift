//
//  ContentView.swift
//  iJarvis
//
//  Created by Lorenzo Tomas Diez on 07/08/2025.
//

import SwiftUI
import CoreData

struct ContentView: View {
    @Environment(\.managedObjectContext) private var viewContext
    @State private var selectedTab = 0

    var body: some View {
        TabView(selection: $selectedTab) {
            NavigationView {
                LifeAreasListView()
            }
            .tabItem {
                Image(systemName: "square.grid.2x2")
                Text("Life Areas")
            }
            .tag(0)
            
            NavigationView {
                GoalsListView()
            }
            .tabItem {
                Image(systemName: "target")
                Text("Goals")
            }
            .tag(1)
            
            NavigationView {
                ProgressListView()
            }
            .tabItem {
                Image(systemName: "chart.line.uptrend.xyaxis")
                Text("Progress")
            }
            .tag(2)
        }
        .environment(\.managedObjectContext, viewContext)
    }
}

#Preview {
    ContentView()
        .environment(\.managedObjectContext, PersistenceController.preview.container.viewContext)
}
