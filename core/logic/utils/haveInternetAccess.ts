const haveInternetAccess = () => {
	if (typeof window === "undefined") return true;
	else return window.navigator?.onLine ?? true;
};

export default haveInternetAccess;
