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

  func testMapsPublicIDsToCompiledAssetNames() {
    let bundleInfo: [String: Any] = [
      "CFBundleIcons": [
        "CFBundleAlternateIcons": ["AppIconPropeler": [:]],
      ],
      "TauriAppIconAliases": ["propeler": "AppIconPropeler"],
    ]

    XCTAssertEqual(IconCatalog.availableIcons(bundleInfo: bundleInfo), ["propeler"])
    XCTAssertEqual(
      IconCatalog.nativeName(for: "propeler", bundleInfo: bundleInfo),
      "AppIconPropeler"
    )
    XCTAssertEqual(
      IconCatalog.publicName(for: "AppIconPropeler", bundleInfo: bundleInfo),
      "propeler"
    )
    XCTAssertNil(IconCatalog.nativeName(for: nil, bundleInfo: bundleInfo))
    XCTAssertNil(IconCatalog.publicName(for: nil, bundleInfo: bundleInfo))
  }

  func testKeepsAlternatesWithoutPublicAliases() {
    let bundleInfo: [String: Any] = [
      "CFBundleIcons": [
        "CFBundleAlternateIcons": [
          "AppIconPropeler": [:],
          "ManuallyConfigured": [:],
        ],
      ],
      "TauriAppIconAliases": ["propeler": "AppIconPropeler"],
    ]

    XCTAssertEqual(
      IconCatalog.availableIcons(bundleInfo: bundleInfo),
      ["ManuallyConfigured", "propeler"]
    )
  }
}
