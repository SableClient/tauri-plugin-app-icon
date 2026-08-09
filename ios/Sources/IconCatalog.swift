import Foundation

enum IconCatalog {
  private static func alternateIcons(bundleInfo: [String: Any]) -> [String: Any] {
    let icons = bundleInfo["CFBundleIcons"] as? [String: Any]
    return icons?["CFBundleAlternateIcons"] as? [String: Any] ?? [:]
  }

  private static func aliases(bundleInfo: [String: Any]) -> [String: String] {
    bundleInfo["TauriAppIconAliases"] as? [String: String] ?? [:]
  }

  static func availableIcons(bundleInfo: [String: Any]) -> [String] {
    let alternates = alternateIcons(bundleInfo: bundleInfo)
    let configuredAliases = aliases(bundleInfo: bundleInfo)
    if configuredAliases.isEmpty {
      return alternates.keys.sorted()
    }

    let aliasedNativeNames = Set(configuredAliases.values)
    let publicNames = configuredAliases
      .filter { alternates[$0.value] != nil }
      .keys
    let unaliasedNativeNames = alternates.keys.filter { !aliasedNativeNames.contains($0) }
    return Set(publicNames).union(unaliasedNativeNames).sorted()
  }

  static func nativeName(for icon: String?, bundleInfo: [String: Any]) -> String? {
    guard let icon else { return nil }
    return aliases(bundleInfo: bundleInfo)[icon] ?? icon
  }

  static func publicName(for nativeName: String?, bundleInfo: [String: Any]) -> String? {
    guard let nativeName else { return nil }
    return aliases(bundleInfo: bundleInfo)
      .filter { $0.value == nativeName }
      .keys
      .sorted()
      .first ?? nativeName
  }
}
