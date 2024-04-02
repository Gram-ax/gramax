const validateEncodingSymbolsUrl = (url: string): boolean => {
	return /^[\w\d\-_]+$/m.test(url);
};

export default validateEncodingSymbolsUrl;
