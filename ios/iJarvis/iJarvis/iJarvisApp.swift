//
//  iJarvisApp.swift
//  iJarvis
//
//  Created by Lorenzo Tomas Diez on 07/08/2025.
//

import SwiftUI

@main
struct iJarvisApp: App {
    let persistenceController = PersistenceController.shared

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environment(\.managedObjectContext, persistenceController.container.viewContext)
        }
    }
}
