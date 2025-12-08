(async () => {
	const DESKTOP_APP_LISTENING_ADDRESS = "http://127.0.0.1:52055";

	delete window.desktopOpened;

	const tryOpen = async (url) => {
		try {
			const controller = new AbortController();
			const id = setTimeout(() => controller.abort(), 400);
			const res = await fetch(url, { signal: controller.signal });
			clearTimeout(id);
			return res.ok;
		} catch {
			return false;
		}
	};

	if (
		typeof window.opener != "undefined" &&
		window.location.pathname.length > 1 &&
		!window.location.search.includes("?web") &&
		!window.localStorage.getItem("NO_DESKTOP")
	) {
		if (await tryOpen(DESKTOP_APP_LISTENING_ADDRESS + window.location.pathname)) {
			window.close();
			window.desktopOpened = true;
			return;
		}
	}
})();
