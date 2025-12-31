export interface SearchFragmentInfo {
	text: string;
	indexInArticle: number;
}

export class ArticleFragmentCounter {
	private readonly fragmentAppearCount: Record<string, number> = {};

	initFragmentInfo(text: string): SearchFragmentInfo {
		const indexInArticle = this.initTextIncludesIndex(text);
		return { text, indexInArticle };
	}

	private initTextIncludesIndex(text: string) {
		const key = text.toLowerCase();

		let addByOtherKeys = 0;
		const existedKeys = Object.keys(this.fragmentAppearCount);
		for (const existedKey of existedKeys) {
			if (existedKey !== key && existedKey.includes(key)) {
				addByOtherKeys += this.fragmentAppearCount[existedKey];
			}
		}

		if (this.fragmentAppearCount[key] === undefined) this.fragmentAppearCount[key] = 1;
		else this.fragmentAppearCount[key]++;

		return this.fragmentAppearCount[key] + addByOtherKeys - 1;
	}
}
