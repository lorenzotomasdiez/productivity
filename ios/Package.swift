// swift-tools-version: 5.9
// The swift-tools-version declares the minimum version of Swift required to build this package.

import PackageDescription

let package = Package(
    name: "JarvisShared",
    platforms: [
        .iOS(.v17),
        .macOS(.v14)
    ],
    products: [
        // Core shared business logic
        .library(
            name: "JarvisCore",
            targets: ["JarvisCore"]
        ),
        // API networking layer
        .library(
            name: "JarvisAPI",
            targets: ["JarvisAPI"]
        ),
        // Shared UI components
        .library(
            name: "JarvisUI",
            targets: ["JarvisUI"]
        ),
    ],
    dependencies: [
        // Add external dependencies here
    ],
    targets: [
        // Core business logic target
        .target(
            name: "JarvisCore",
            dependencies: [],
            path: "Sources/JarvisCore"
        ),
        .testTarget(
            name: "JarvisCoreTests",
            dependencies: ["JarvisCore"],
            path: "Tests/JarvisCoreTests"
        ),
        
        // API networking target
        .target(
            name: "JarvisAPI",
            dependencies: ["JarvisCore"],
            path: "Sources/JarvisAPI"
        ),
        .testTarget(
            name: "JarvisAPITests",
            dependencies: ["JarvisAPI", "JarvisCore"],
            path: "Tests/JarvisAPITests"
        ),
        
        // Shared UI components target
        .target(
            name: "JarvisUI",
            dependencies: ["JarvisCore"],
            path: "Sources/JarvisUI"
        ),
        .testTarget(
            name: "JarvisUITests",
            dependencies: ["JarvisUI", "JarvisCore"],
            path: "Tests/JarvisUITests"
        ),
    ]
)