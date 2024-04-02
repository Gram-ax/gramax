const GITHUB_TOKEN_STARTS_WITH = "?access_token=ghu_";

const STORAGE_KEY = "GITHUB_TEMP_TOKEN";

export const saveTempGithubTokenIfPresent = () => {
	if (!window.location.search.startsWith(GITHUB_TOKEN_STARTS_WITH)) {
		window.localStorage.removeItem(STORAGE_KEY);
		return false;
	}
	window.localStorage.setItem(STORAGE_KEY, window.location.search);
	return true;
};

export const waitForTempGithubToken = async (): Promise<string> => {
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
