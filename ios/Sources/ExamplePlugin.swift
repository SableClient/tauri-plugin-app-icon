import SwiftRs
import Tauri
import UIKit
import WebKit

private struct SetIconArgs: Decodable {
  let icon: String?
}

class AppIconPlugin: Plugin {
  private func availableIcons() -> [String] {
    IconCatalog.availableIcons(bundleInfo: Bundle.main.infoDictionary ?? [:])
  }

  @objc public func getAvailableIcons(_ invoke: Invoke) {
    invoke.resolve(availableIcons())
  }

  @objc public func getCurrentIcon(_ invoke: Invoke) {
    invoke.resolve(["icon": UIApplication.shared.alternateIconName ?? NSNull()])
  }

  @objc public func setIcon(_ invoke: Invoke) throws {
    let icon = try invoke.parseArgs(SetIconArgs.self).icon
    if let icon, !availableIcons().contains(icon) {
      invoke.reject("Unknown app icon: \(icon)")
      return
    }
    guard UIApplication.shared.supportsAlternateIcons else {
      invoke.reject("This app has no alternate icons configured")
      return
    }

    DispatchQueue.main.async {
      UIApplication.shared.setAlternateIconName(icon) { error in
        if let error {
          invoke.reject(error.localizedDescription)
        } else {
          invoke.resolve()
        }
      }
    }
  }
}

@_cdecl("init_plugin_app_icon")
func initPlugin() -> Plugin {
  return AppIconPlugin()
}
