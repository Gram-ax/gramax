(function () {
	var id = "custom-style-link";
	var styleId = "custom-style-inline";

	function loadAndMoveStyles() {
		var link = document.getElementById(id);
		if (!link) return;

		function copyStylesToInline() {
			if (!link.sheet) return;
			var sheet = Array.from(document.styleSheets).find(function (s) {
				return s.ownerNode === link;
			});

			if (!sheet || !sheet.cssRules) return;

			var cssText = Array.from(sheet.cssRules)
				.map(function (rule) {
					return rule.cssText;
				})
				.join("\n");

			var style = document.createElement("style");
			style.id = styleId;
			style.textContent = cssText;
			document.head.appendChild(style);
			link.remove();
			startObserving();
		}
		if (link.sheet) {
			copyStylesToInline();
		} else {
			link.onload = copyStylesToInline;
			link.onerror = function () {
				console.warn("Failed to load custom styles from link");
				if (document.head.lastElementChild !== link) {
					document.head.appendChild(link);
				}
			};
		}
	}

	function ensureStyleLast() {
		var style = document.getElementById(styleId);
		if (!style || !document.head) return;

		if (document.head.lastElementChild !== style) {
			document.head.appendChild(style);
		}
	}

	function startObserving() {
		try {
			var obs = new MutationObserver(function () {
				ensureStyleLast();
			});
			obs.observe(document.head, { childList: true, subtree: false });
			setTimeout(function () {
				obs.disconnect();
			}, 10000);
		} catch (e) {}
	}

	if (document.readyState === "complete") {
		loadAndMoveStyles();
	} else {
		window.addEventListener("load", loadAndMoveStyles, { once: true });
	}
})();
