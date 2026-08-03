import XCTest
@testable import tauri_plugin_app_icon

final class IconCatalogTests: XCTestCase {
  func testReturnsSortedAlternateIconIDs() {
    let icons = IconCatalog.availableIcons(bundleInfo: [
      "CFBundleIcons": [
        "CFBundleAlternateIcons": ["sunrise": [:], "midnight": [:]],
      ],
    ])

    XCTAssertEqual(icons, ["midnight", "sunrise"])
  }

  func testReturnsNoIconsWhenAlternatesAreNotConfigured() {
    XCTAssertEqual(IconCatalog.availableIcons(bundleInfo: [:]), [])
  }
}
