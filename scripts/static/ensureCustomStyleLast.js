(function () {
	var id = "custom-style-link";
	function moveLast() {
		var link = document.getElementById(id);
		if (!link || !document.head) return;
		try {
			document.head.appendChild(link);
		} catch (e) {}
	}
	function schedule() {
		if (typeof requestAnimationFrame === "function") {
			requestAnimationFrame(function () {
				setTimeout(moveLast, 0);
			});
		} else {
			setTimeout(moveLast, 0);
		}
	}
	if (document.readyState === "complete" || document.readyState === "interactive") {
		schedule();
	} else {
		document.addEventListener("DOMContentLoaded", schedule, { once: true });
	}
	window.addEventListener("load", schedule, { once: true });
	try {
		var obs = new MutationObserver(function () {
			schedule();
		});
		obs.observe(document.head, { childList: true, subtree: false });
		setTimeout(function () {
			obs.disconnect();
		}, 10000);
	} catch (e) {}
})();
