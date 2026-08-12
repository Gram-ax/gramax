(function () {
	var id = "custom-style-link";
	var styleId = "dynamic-styles";
	var customStyle;

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

			customStyle = document.createElement("style");
			customStyle.id = styleId;
			customStyle.textContent = cssText;
			document.head.appendChild(customStyle);
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

	function ensureStyleLast(observer) {
		if (!customStyle || !document.head || customStyle.parentNode !== document.head) return;
		if (document.head.lastElementChild === customStyle) return;

		observer.disconnect();
		document.head.appendChild(customStyle);
		observer.observe(document.head, { childList: true, subtree: false });
	}

	function startObserving() {
		try {
			var observer = new MutationObserver(function () {
				ensureStyleLast(observer);
			});
			observer.observe(document.head, { childList: true, subtree: false });
			setTimeout(function () {
				observer.disconnect();
			}, 10000);
		} catch (e) {}
	}

	if (document.readyState === "complete") {
		loadAndMoveStyles();
	} else {
		window.addEventListener("load", loadAndMoveStyles, { once: true });
	}
})();
