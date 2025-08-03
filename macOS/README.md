# Jarvis macOS App

## Overview
Jarvis is a personal life management system built with SwiftUI for macOS. This app provides a comprehensive interface for managing life areas, goals, progress tracking, and AI-powered insights.

## Features
- **Dashboard**: Overview of your life management metrics
- **Life Areas**: Manage different areas of your life (health, finance, learning, etc.)
- **Goals**: Create and track goals with progress monitoring
- **Progress**: Detailed progress tracking with statistics
- **Jarvis Chat**: AI-powered assistant for insights and guidance

## Requirements
- macOS 14.0+
- Xcode 15.0+
- Swift 5.9+

## Project Structure
```
macOS/
├── Jarvis.xcodeproj/          # Xcode project file
├── Jarvis/                    # Main app source code
│   ├── JarvisApp.swift        # App entry point
│   ├── ContentView.swift      # Main UI structure
│   └── Assets.xcassets/       # App assets
├── JarvisTests/               # Unit tests
├── JarvisUITests/             # UI tests
└── Shared/                    # Shared resources
```

## Setup Instructions

### 1. Open the Project
```bash
cd macOS
open Jarvis.xcodeproj
```

### 2. Build and Run
- Select the "Jarvis" target
- Choose your Mac as the destination
- Press Cmd+R to build and run

### 3. Development
The app uses SwiftUI with a modern sidebar navigation pattern:
- **Sidebar**: Navigation between different sections
- **Main Content**: Dynamic content based on selection
- **Responsive Design**: Adapts to different window sizes

## Architecture
- **SwiftUI**: Modern declarative UI framework
- **NavigationView**: Sidebar-based navigation
- **@State**: Local state management
- **Modular Design**: Separate views for each feature

## Backend Integration
The app is designed to integrate with the Jarvis backend API:
- Authentication with Apple Sign In
- RESTful API communication
- Real-time data synchronization
- Offline data persistence

## Testing
- **Unit Tests**: Business logic testing
- **UI Tests**: User interface testing
- **Performance Tests**: App launch and performance metrics

## Next Steps
1. Integrate with backend API
2. Add Core Data for local persistence
3. Implement Apple Sign In
4. Add real-time chat functionality
5. Create iOS companion app

## Contributing
This project follows the same development workflow as the backend:
- Test-Driven Development (TDD)
- Type-safe Swift code
- Comprehensive testing
- Modern SwiftUI patterns 