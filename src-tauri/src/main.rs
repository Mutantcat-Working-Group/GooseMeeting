#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

#[cfg(target_os = "linux")]
fn configure_linux_media(app: &tauri::App) -> tauri::Result<()> {
    use gtk::prelude::*;
    use tauri::Manager;
    use webkit2gtk::{PermissionRequestExt, SettingsExt, WebViewExt};

    app.get_webview_window("main")
        .expect("main window")
        .with_webview(|webview| {
            let view = webview.inner();
            if let Some(settings) = WebViewExt::settings(&view) {
                settings.set_enable_media_stream(true);
                settings.set_enable_webrtc(true);
            }
            view.connect_permission_request(|view, request| {
                if !request.is::<webkit2gtk::UserMediaPermissionRequest>() {
                    return false;
                }
                let trusted = view
                    .uri()
                    .and_then(|uri| tauri::Url::parse(&uri).ok())
                    .is_some_and(|uri| {
                        (uri.scheme() == "tauri" && uri.host_str() == Some("localhost"))
                            || (cfg!(debug_assertions)
                                && uri.scheme() == "http"
                                && uri.host_str() == Some("127.0.0.1")
                                && uri.port() == Some(1420))
                    });
                if !trusted {
                    request.deny();
                    return true;
                }
                let parent = view
                    .toplevel()
                    .and_then(|widget| widget.downcast::<gtk::Window>().ok());
                let dialog = gtk::MessageDialog::new(
                    parent.as_ref(),
                    gtk::DialogFlags::MODAL,
                    gtk::MessageType::Question,
                    gtk::ButtonsType::YesNo,
                    "Allow GooseMeeting to use your camera and microphone?",
                );
                let request = request.clone();
                dialog.connect_response(move |dialog, response| {
                    if response == gtk::ResponseType::Yes {
                        request.allow();
                    } else {
                        request.deny();
                    }
                    dialog.close();
                });
                dialog.show_all();
                true
            });
        })
}

fn main() {
    tauri::Builder::default()
        .setup(|_app| {
            #[cfg(target_os = "linux")]
            configure_linux_media(_app)?;
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("failed to run GooseMeeting");
}
