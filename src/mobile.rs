use serde::de::DeserializeOwned;
use tauri::{
    plugin::{PluginApi, PluginHandle},
    AppHandle, Runtime,
};

#[cfg(target_os = "ios")]
tauri::ios_plugin_binding!(init_plugin_app_icon);

pub fn init<R: Runtime, C: DeserializeOwned>(
    _app: &AppHandle<R>,
    api: PluginApi<R, C>,
) -> crate::Result<AppIcon<R>> {
    #[cfg(target_os = "android")]
    let handle = api.register_android_plugin("com.plugin.appicon", "AppIconPlugin")?;
    #[cfg(target_os = "ios")]
    let handle = api.register_ios_plugin(init_plugin_app_icon)?;
    Ok(AppIcon(handle))
}

/// Access to the app-icon APIs.
pub struct AppIcon<R: Runtime>(PluginHandle<R>);

impl<R: Runtime> AppIcon<R> {
    pub fn available_icons(&self) -> crate::Result<Vec<String>> {
        self.0
            .run_mobile_plugin("getAvailableIcons", ())
            .map_err(Into::into)
    }

    pub fn current_icon(&self) -> crate::Result<Option<String>> {
        self.0
            .run_mobile_plugin("getCurrentIcon", ())
            .map(|response: crate::CurrentIconResponse| response.icon)
            .map_err(Into::into)
    }

    pub fn set_icon(&self, icon: Option<String>) -> crate::Result<()> {
        self.0
            .run_mobile_plugin("setIcon", crate::SetIconRequest { icon })
            .map_err(Into::into)
    }
}
