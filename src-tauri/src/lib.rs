#[cfg(target_os = "macos")]
use tauri::TitleBarStyle;
use tauri::{WebviewUrl, WebviewWindowBuilder};
use tauri_plugin_prevent_default::Flags;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let prevent_default_plugin = tauri_plugin_prevent_default::Builder::new()
        .with_flags(Flags::RELOAD)
        .build();

    tauri::Builder::default()
        .plugin(prevent_default_plugin)
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_os::init())
        .setup(|app| {
            let mut builder = WebviewWindowBuilder::new(app, "main", WebviewUrl::default())
                .title("Deditor")
                .inner_size(1920.0, 1080.0)
                .resizable(true)
                .fullscreen(false)
                .decorations(true)
                .transparent(false)
                .shadow(true);

            #[cfg(target_os = "macos")]
            {
                builder = builder.title_bar_style(TitleBarStyle::Transparent);
            }

            match builder.build() {
                Ok(_) => {}
                Err(e) => {
                    eprintln!("Failed to build webview window: {}", e);
                    std::process::exit(1);
                }
            }

            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
