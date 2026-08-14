use tauri::{AppHandle, WebviewUrl, WebviewWindowBuilder};

#[tauri::command]
pub async fn open_web_console_window(
    app: AppHandle,
    url: String,
    title: String,
) -> Result<(), String> {
    let window_label = format!("web_console_{}", uuid::Uuid::new_v4().simple());

    let parsed_url = url
        .parse::<url::Url>()
        .map_err(|e| format!("URL inválida: {}", e))?;

    let builder = WebviewWindowBuilder::new(
        &app,
        window_label,
        WebviewUrl::External(parsed_url),
    )
    .title(title)
    .inner_size(1280.0, 800.0)
    .center()
    .resizable(true);

    builder
        .build()
        .map_err(|e| format!("Error al crear ventana de Consola Web: {}", e))?;

    Ok(())
}
