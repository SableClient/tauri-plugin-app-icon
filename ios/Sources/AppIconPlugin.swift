import Tauri
import UIKit

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

  // UIApplication may only be touched on the main thread; Tauri runs commands on its IPC queue.
  @objc public func getCurrentIcon(_ invoke: Invoke) {
    DispatchQueue.main.async {
      invoke.resolve(["icon": UIApplication.shared.alternateIconName ?? NSNull()])
    }
  }

  @objc public func setIcon(_ invoke: Invoke) throws {
    let icon = try invoke.parseArgs(SetIconArgs.self).icon
    if let icon, !availableIcons().contains(icon) {
      invoke.reject("Unknown app icon: \(icon)")
      return
    }

    DispatchQueue.main.async {
      guard UIApplication.shared.supportsAlternateIcons else {
        invoke.reject("This app has no alternate icons configured")
        return
      }

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
