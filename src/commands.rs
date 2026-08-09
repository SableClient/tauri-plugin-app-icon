use tauri::{command, AppHandle, Runtime};

use crate::AppIconExt;
use crate::Result;
use crate::SetIconRequest;

#[command]
pub(crate) async fn get_available_icons<R: Runtime>(app: AppHandle<R>) -> Result<Vec<String>> {
    tauri::async_runtime::spawn_blocking(move || app.app_icon().available_icons())
        .await
        .map_err(|error| crate::Error::Worker(error.to_string()))?
}

#[command]
pub(crate) async fn get_current_icon<R: Runtime>(app: AppHandle<R>) -> Result<Option<String>> {
    tauri::async_runtime::spawn_blocking(move || app.app_icon().current_icon())
        .await
        .map_err(|error| crate::Error::Worker(error.to_string()))?
}

#[command]
pub(crate) async fn set_icon<R: Runtime>(app: AppHandle<R>, request: SetIconRequest) -> Result<()> {
    tauri::async_runtime::spawn_blocking(move || app.app_icon().set_icon(request.icon))
        .await
        .map_err(|error| crate::Error::Worker(error.to_string()))?
}
