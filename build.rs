const COMMANDS: &[&str] = &["get_available_icons", "get_current_icon", "set_icon"];

fn main() {
    tauri_plugin::Builder::new(COMMANDS)
        .android_path("android")
        .ios_path("ios")
        .build();
}
