import { StringRewriter } from "./StringRewriter";

function multiLayoutSearcher<T>(searcher: (query: string) => T, sync: boolean): (query: string) => T;
function multiLayoutSearcher<T>(searcher: (query: string) => Promise<T>): (query: string) => Promise<T>;
function multiLayoutSearcher<T>(searcher: (query: string) => T | Promise<T>, sync?: boolean) {
	const stringRewriter = new StringRewriter();
	const transformations = [
		(query: string) => stringRewriter.changeTextLayout(query),
		(query: string) => stringRewriter.changeRussianToEnglishTransliteration(query),
		(query: string) => stringRewriter.changeEnglishToRussianTransliteration(query),
	];

	if (sync)
		return (query: string) => {
			let result = searcher(query);

			for (const transform of transformations) {
				if (result) return result;
				const transformedQuery = transform(query);
				result = searcher(transformedQuery);
			}

			return result;
		};

	return async (query: string) => {
		let result = await searcher(query);

		for (const transform of transformations) {
			if (result) return result;
			const transformedQuery = transform(query);
			result = await searcher(transformedQuery);
		}

		return result;
	};
}

export default multiLayoutSearcher;
