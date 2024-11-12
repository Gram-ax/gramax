(async () => {
	const DESKTOP_APP_LISTENING_ADDRESS = "http://127.0.0.1:52055";

	if (
		typeof window.opener != "undefined" &&
		window.location.pathname.length > 1 &&
		!window.location.search.includes("?web") &&
		!window.localStorage.getItem("NO_DESKTOP")
	) {
		try {
			let res = await fetch(DESKTOP_APP_LISTENING_ADDRESS);
			if (!res.ok) return;
			res = await fetch(DESKTOP_APP_LISTENING_ADDRESS + window.location.pathname);
			if (res.ok) window.close();
			window.desktopOpened = true;
		} catch {}
	}
})();
