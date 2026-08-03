// swift-tools-version:5.3

import PackageDescription

let package = Package(
    name: "tauri-plugin-app-icon",
    platforms: [
        .macOS(.v10_13),
        .iOS(.v13),
    ],
    products: [
        .library(
            name: "tauri-plugin-app-icon",
            type: .static,
            targets: ["tauri-plugin-app-icon"]),
    ],
    dependencies: [
        .package(name: "Tauri", path: "../.tauri/tauri-api")
    ],
    targets: [
        .target(
            name: "tauri-plugin-app-icon",
            dependencies: [
                .byName(name: "Tauri")
            ],
            path: "Sources"),
        .testTarget(
            name: "tauri-plugin-app-iconTests",
            dependencies: ["tauri-plugin-app-icon"],
            path: "Tests")
    ]
)
