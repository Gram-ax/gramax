export const getGesSignInUrl = (gesUrl: string, isBrowser: boolean) => {
	const redirect = encodeURIComponent(
		isBrowser ? (typeof window !== "undefined" ? window.location.href : "") : `http://localhost:52054`,
	);
	const url = `${gesUrl}/sso/login?redirect=${redirect}&from=${redirect}`;
	return url;
};
