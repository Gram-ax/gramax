// fixes: https://github.com/Gram-ax/gramax/issues/121
const handleShortcuts = (e) => {
	// Handle Ctrl+T for new_window
	if (e.ctrlKey && e.key === "t") {
		e.preventDefault();
		window.__TAURI__.core.invoke("new_window");
	}
	// Handle Ctrl+W for close_window
	if (e.ctrlKey && e.key === "w") {
		e.preventDefault();
		window.close();
	}
	// Handle Ctrl+M for hide_window
	if (e.ctrlKey && e.key === "m") {
		e.preventDefault();
		window.__TAURI__.core.invoke("minimize_window");
	}
};

if (window.addEventListener) window.addEventListener("keydown", handleShortcuts, true);
else if (document.attachEvent) document.attachEvent("onkeydown", handleShortcuts);
else document.addEventListener("keydown", handleShortcuts, true);
