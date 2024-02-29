import { StringRewriter } from "./StringRewriter";

const multiLayoutSearcher = <T>(searcher: (query: string) => T | Promise<T>) => {
	return async (query: string) => {
		let result = await searcher(query);

		if (result) return result;

		const stringRewriter = new StringRewriter();
		const wrongLayoutQuery = stringRewriter.changeTextLayout(query);
		result = await searcher(wrongLayoutQuery);

		if (result) return result;

		const RuToEnRev = stringRewriter.changeRussianToEnglishTransliteration(query);
		result = await searcher(RuToEnRev);

		if (result) return result;

		const EnToRuRev = stringRewriter.changeEnglishToRussianTransliteration(query);
		result = await searcher(EnToRuRev);

		return result;
	};
};

export default multiLayoutSearcher;
