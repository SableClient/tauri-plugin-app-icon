import Foundation

enum IconCatalog {
  static func availableIcons(bundleInfo: [String: Any]) -> [String] {
    let icons = bundleInfo["CFBundleIcons"] as? [String: Any]
    let alternateIcons = icons?["CFBundleAlternateIcons"] as? [String: Any]
    return alternateIcons?.keys.sorted() ?? []
  }
}
