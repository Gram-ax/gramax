window.close = () => window.__TAURI__.primitives.invoke("close_current_window");
