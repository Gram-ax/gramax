const matomoMetric = ({
	matomoUrl,
	matomoSiteId,
	matomoContainerUrl,
}: {
	matomoUrl: string;
	matomoSiteId: string;
	matomoContainerUrl: string;
}) => {
	//@ts-expect-error paq and mtm will be in window
	if (typeof window === "undefined" || (!matomoUrl && !matomoContainerUrl) || window._mtm || window._paq) return;

	const matomoUrlWithSlash = matomoUrl?.endsWith("/") ? matomoUrl : `${matomoUrl}/`;

	if (matomoContainerUrl) {
		//@ts-expect-error paq now will be in window
		const matomoTagManager = (window._mtm = window._mtm || []);

		matomoTagManager.push({ "mtm.startTime": new Date().getTime(), event: "mtm.Start" });

		const script = document.createElement("script");

		script.id = "matomo";
		script.async = true;
		script.src = matomoContainerUrl.includes("://") ? matomoContainerUrl : matomoUrlWithSlash + matomoContainerUrl;

		document.head.appendChild(script);
	}

	//@ts-expect-error paq now will be in window
	const _paq: any[] = (window._paq = window._paq || []);

	_paq.push(["trackPageView"]);
	_paq.push(["enableLinkTracking"]);

	_paq.push(["setTrackerUrl", matomoUrlWithSlash + "matomo.php"]);
	_paq.push(["setSiteId", matomoSiteId]);

	const script = document.createElement("script");

	script.id = "matomo";
	script.async = true;
	script.src = matomoUrlWithSlash + "matomo.js";

	document.head.appendChild(script);
};

export default matomoMetric;
