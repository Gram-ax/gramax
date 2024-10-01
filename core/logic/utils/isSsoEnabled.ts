const isSsoEnabled = (config: { url: string; key: string }) => {
	return Boolean(config?.key && config?.url);
};

export default isSsoEnabled;
