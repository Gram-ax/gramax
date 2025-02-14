window.close = () => window.__TAURI__.core.invoke("close_current_window");
