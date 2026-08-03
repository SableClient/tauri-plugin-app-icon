use tauri::{command, AppHandle, Runtime};

use crate::AppIconExt;
use crate::Result;
use crate::SetIconRequest;

#[command]
pub(crate) fn get_available_icons<R: Runtime>(app: AppHandle<R>) -> Result<Vec<String>> {
    app.app_icon().available_icons()
}

#[command]
pub(crate) fn get_current_icon<R: Runtime>(app: AppHandle<R>) -> Result<Option<String>> {
    app.app_icon().current_icon()
}

#[command]
pub(crate) fn set_icon<R: Runtime>(app: AppHandle<R>, request: SetIconRequest) -> Result<()> {
    app.app_icon().set_icon(request.icon)
}
