window.print = () => window.__TAURI__.core.invoke("show_print");

// https://support.ics-it.ru/issue/GXS-1595
const rx = /INPUT|SELECT|TEXTAREA/i;

const captureBackspace = (e) => {
	// 8 == backspace
	if (e.which == 8) {
		if (e.target.getAttribute("contenteditable") !== null) return;

		if (!rx.test(e.target.tagName) || e.target.disabled || e.target.readOnly) e.preventDefault();
	}
};

if (window.addEventListener) window.addEventListener("keydown", captureBackspace, true);
else if (document.attachEvent) document.attachEvent("onkeydown", captureBackspace);
else document.addEventListener("keydown", captureBackspace, true);
