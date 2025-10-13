const validateToken = (token: string) => {
	// eslint-disable-next-line no-control-regex
	const hasNonISOChars = /[^\x00-\xFF]/.test(token);
	return !hasNonISOChars;
};

export default validateToken;
