type Query = { [key: string]: string };

export const parserQuery = (query: string): Query => {
	const urlSearchParams = new URLSearchParams(query);
	return Object.fromEntries(urlSearchParams);
};

export default Query;
