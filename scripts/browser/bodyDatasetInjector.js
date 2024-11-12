let theme = localStorage.getItem("theme") || "";
const isDeviceDarkTheme = window.matchMedia("(prefers-color-scheme: dark)").matches;
const device_theme = isDeviceDarkTheme ? "dark" : "light";

if (!["dark", "light"].includes(theme)) {
	theme = device_theme;
}
document.body.dataset.theme = theme;
