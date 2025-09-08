const isSafari = () => {
	const IS_SAFARI =
		typeof window !== "undefined" &&
		/Safari/.test(navigator.userAgent) &&
		navigator.vendor === "Apple Computer, Inc.";

	return IS_SAFARI;
};

export default isSafari;
