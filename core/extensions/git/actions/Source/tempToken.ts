const STORAGE_KEY = "TEMP_TOKEN";

export const saveTempTokenIfPresent = (filter: RegExp) => {
	if (!filter.test(window.location.search)) {
		window.localStorage.removeItem(STORAGE_KEY);
		return false;
	}
	window.localStorage.setItem(STORAGE_KEY, window.location.search);
	return true;
};

export const waitForTempToken = async (): Promise<string> => {
	let count = 300;
	let token = "";
	while (!token || count--) {
		await new Promise((resolve) => setTimeout(resolve, 500));
		token = window.localStorage.getItem(STORAGE_KEY);
		if (token) {
			window.localStorage.removeItem(STORAGE_KEY);
			return token;
		}
	}
};
