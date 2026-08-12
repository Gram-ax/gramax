export const getGesSignInUrl = (gesUrl: string, isWeb: boolean) => {
	const redirect = encodeURIComponent(
		isWeb ? (typeof window !== "undefined" ? window.location.href : "") : `http://localhost:52054`,
	);
	const url = `${gesUrl}/sso/login?redirect=${redirect}&from=${redirect}`;
	return url;
};
