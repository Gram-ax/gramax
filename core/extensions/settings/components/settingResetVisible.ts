export const isResettable = (value: unknown, defaultValue: unknown): boolean => {
	if (value === undefined || value === null || value === "") {
		return defaultValue !== undefined && defaultValue !== null && defaultValue !== "";
	}
	return JSON.stringify(value) !== JSON.stringify(defaultValue);
};
