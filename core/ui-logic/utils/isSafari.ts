const isSafari = () => {
	if (typeof window === "undefined") return false;
	if (!window.navigator || !window.navigator.vendor) return false;

	const IS_SAFARI = window.navigator.vendor === "Apple Computer, Inc.";

	return IS_SAFARI;
};

export default isSafari;
