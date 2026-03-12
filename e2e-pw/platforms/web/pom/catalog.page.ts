import type { TocItem } from "@gramax/core/extensions/navigation/article/logic/createTocItems";
import { Dropdown } from "@shared-pom/dropdown";
import type { JSONContent } from "@tiptap/core";
import BasePage from "./base.page";

export type ArticleContentDto = {
	md: string;
	html?: string;
	editTree?: JSONContent;
	toc?: TocItem[];
};

export default class CatalogPage extends BasePage {
	async currentArticleContent(markdownOnly: boolean = true): Promise<ArticleContentDto> {
		return await this._page.evaluate(async (markdownOnly) => {
			const app = await window.app!;
			const { catalogName, itemLogicPath } = window.debug.RouterPathProvider.parsePath(window.location.pathname);
			const catalog = await app.wm.current().getContextlessCatalog(catalogName!);
			const article = catalog.findArticle(itemLogicPath!.join("/"), []);

			if (markdownOnly) return { md: article.content };

			const parsedContent = await article.parsedContent.read();

			return {
				md: article.content,
				html: await parsedContent.getHtmlValue.get(),
				editTree: parsedContent.editTree,
				toc: parsedContent.tocItems,
			};
		}, markdownOnly);
	}

	async getCatalogActions(): Promise<Dropdown> {
		const dropdown = new Dropdown(this._page, this._page.getByTestId("catalog-actions"));
		await dropdown.assertTriggerVisible();
		return dropdown;
	}
}
