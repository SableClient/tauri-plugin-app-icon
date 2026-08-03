use serde::de::DeserializeOwned;
use tauri::{plugin::PluginApi, AppHandle, Runtime};

pub fn init<R: Runtime, C: DeserializeOwned>(
    app: &AppHandle<R>,
    _api: PluginApi<R, C>,
) -> crate::Result<AppIcon<R>> {
    Ok(AppIcon(app.clone()))
}

/// Access to the app-icon APIs.
pub struct AppIcon<R: Runtime>(AppHandle<R>);

impl<R: Runtime> AppIcon<R> {
    pub fn available_icons(&self) -> crate::Result<Vec<String>> {
        Err(crate::Error::UnsupportedPlatform)
    }

    pub fn current_icon(&self) -> crate::Result<Option<String>> {
        Err(crate::Error::UnsupportedPlatform)
    }

    pub fn set_icon(&self, _icon: Option<String>) -> crate::Result<()> {
        Err(crate::Error::UnsupportedPlatform)
    }
}
