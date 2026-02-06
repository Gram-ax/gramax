import { ArticleBlock, ArticleItem } from "@ics/gx-vector-search";

export default class HeaderArticleBlock implements ArticleBlock {
	type: "block" = "block" as const;
	items: ArticleItem[] = [];

	constructor(
		public readonly level: number,
		public title: string,
	) {}

	toJSON() {
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const { level, ...rest } = this;
		return rest;
	}
}
