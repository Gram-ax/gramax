import { StringRewriter } from "./StringRewriter";

export interface ArgsBase {
	sync?: false;
	signal?: AbortSignal;
}

export interface AsyncArgs<T> extends ArgsBase {
	searcher: (query: string) => Promise<T>;
}

export interface SyncArgs<T> extends Omit<ArgsBase, "sync"> {
	sync: true;
	searcher: (query: string) => T;
}

export type Args<T> = AsyncArgs<T> | SyncArgs<T>;

function multiLayoutSearcher<T>(args: SyncArgs<T>): (typeof args)["searcher"];
function multiLayoutSearcher<T>(args: AsyncArgs<T>): (typeof args)["searcher"];
function multiLayoutSearcher<T>(args: SyncArgs<T> | AsyncArgs<T>): (typeof args)["searcher"];
function multiLayoutSearcher<T>({ sync, searcher, signal }: SyncArgs<T> | AsyncArgs<T>) {
	const stringRewriter = new StringRewriter();
	const transformations = [
		(query: string) => stringRewriter.changeTextLayout(query),
		(query: string) => stringRewriter.changeRussianToEnglishTransliteration(query),
		(query: string) => stringRewriter.changeEnglishToRussianTransliteration(query),
	];

	if (sync === true)
		return (query: string) => {
			let result = searcher(query);

			for (const transform of transformations) {
				if (signal?.aborted || (result && (!Array.isArray(result) || result.length > 0))) return result;
				const transformedQuery = transform(query);
				result = searcher(transformedQuery);
			}

			return result;
		};

	return async (query: string) => {
		let result = await searcher(query);

		for (const transform of transformations) {
			if (signal?.aborted || (result && (!Array.isArray(result) || result.length > 0))) return result;
			const transformedQuery = transform(query);
			result = await searcher(transformedQuery);
		}

		return result;
	};
}

export default multiLayoutSearcher;
