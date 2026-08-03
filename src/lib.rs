use tauri::{
    plugin::{Builder, TauriPlugin},
    Manager, Runtime,
};

pub use models::*;

#[cfg(desktop)]
mod desktop;
#[cfg(mobile)]
mod mobile;

mod commands;
mod error;
mod models;

pub use error::{Error, Result};

#[cfg(desktop)]
use desktop::AppIcon;
#[cfg(mobile)]
use mobile::AppIcon;

/// Extensions to [`tauri::App`], [`tauri::AppHandle`] and [`tauri::Window`] to access the app-icon APIs.
pub trait AppIconExt<R: Runtime> {
    fn app_icon(&self) -> &AppIcon<R>;
}

impl<R: Runtime, T: Manager<R>> crate::AppIconExt<R> for T {
    fn app_icon(&self) -> &AppIcon<R> {
        self.state::<AppIcon<R>>().inner()
    }
}

/// Initializes the plugin.
pub fn init<R: Runtime>() -> TauriPlugin<R> {
    Builder::new("app-icon")
        .invoke_handler(tauri::generate_handler![
            commands::get_available_icons,
            commands::get_current_icon,
            commands::set_icon
        ])
        .setup(|app, api| {
            #[cfg(mobile)]
            let app_icon = mobile::init(app, api)?;
            #[cfg(desktop)]
            let app_icon = desktop::init(app, api)?;
            app.manage(app_icon);
            Ok(())
        })
        .build()
}
