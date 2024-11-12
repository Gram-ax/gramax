const getIsDevMode = (): boolean => {
	if (typeof window === "undefined") return false;
	return !!(window as any).debug?.devMode.check();
};

export default getIsDevMode;
