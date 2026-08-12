// fixes: https://github.com/Gram-ax/gramax/issues/121
//        https://github.com/Gram-ax/gramax/issues/777
// uses e.code (physical key) so shortcuts work on non-Latin keyboard layouts
const handleShortcuts = (e) => {
	if (!e.ctrlKey) return;
	switch (e.code) {
		case "KeyN":
		case "KeyT":
			e.preventDefault();
			window.__TAURI__.core.invoke("new_window");
			break;
		case "KeyW":
			e.preventDefault();
			window.close();
			break;
		case "KeyM":
			e.preventDefault();
			window.__TAURI__.core.invoke("minimize_window");
			break;
	}
};

if (window.addEventListener) window.addEventListener("keydown", handleShortcuts, true);
else if (document.attachEvent) document.attachEvent("onkeydown", handleShortcuts);
else document.addEventListener("keydown", handleShortcuts, true);
