type Query = { [key: string]: string };

export const parserQuery = <T = Query>(query: string): T => {
	const urlSearchParams = new URLSearchParams(query);
	return Object.fromEntries(urlSearchParams) as T;
};

export default Query;
