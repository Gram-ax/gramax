const isNavigatorAvailable = () => {
	return typeof navigator !== "undefined" && navigator.clipboard;
};

export default isNavigatorAvailable;
