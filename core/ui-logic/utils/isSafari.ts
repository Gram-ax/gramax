const isSafari = () => {
	if (typeof window === "undefined") return false;

	const IS_SAFARI =
		window.navigator &&
		/Safari/.test(window.navigator.userAgent) &&
		window.navigator.vendor === "Apple Computer, Inc.";

	return IS_SAFARI;
};

export default isSafari;
