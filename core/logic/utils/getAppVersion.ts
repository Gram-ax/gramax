const getAppVersion = (version: string, isRelease: boolean): string => {
	if (!version) return "0.0.0";
	return `${version} ${isRelease ? "" : "dev"}`.trim();
};

export default getAppVersion;
