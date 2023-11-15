import { JSONContent } from "@tiptap/core";
import MarkdownParser from "../../extensions/markdown/core/Parser/Parser";
import ParserContextFactory from "../../extensions/markdown/core/Parser/ParserContext/ParserContextFactory";
import MarkdownFormatter from "../../extensions/markdown/core/edit/logic/Formatter/Formatter";
import Context from "../Context/Context";
import Path from "../FileProvider/Path/Path";
import { Article } from "../FileStructue/Article/Article";
import parseContent from "../FileStructue/Article/parseContent";
import { Catalog } from "../FileStructue/Catalog/Catalog";
import { Category } from "../FileStructue/Category/Category";
import { ItemType } from "../FileStructue/Item/Item";

class ResourceUpdater {
	constructor(
		private _rc: Context,
		private _parser: MarkdownParser,
		private _parserContextFactory: ParserContextFactory,
		private _formatter: MarkdownFormatter,
	) {}

	async updateCategory(category: Category, catalog: Catalog, newBasePath: Path) {
		await this.updateArticle(category, catalog, newBasePath);
		for (const item of category.items) {
			const childNewBasePath = newBasePath.parentDirectoryPath.join(
				category.ref.path.parentDirectoryPath.subDirectory(item.ref.path),
			);
			if (item.type === ItemType.category) {
				await this.updateCategory(item as Category, catalog, childNewBasePath);
			} else {
				await this.updateArticle(item as Article, catalog, childNewBasePath);
			}
		}
	}

	async updateArticle(article: Article, catalog: Catalog, newBasePath: Path) {
		if (article?.content) await parseContent(article, catalog, this._rc, this._parser, this._parserContextFactory);
		if (!article?.parsedContent) return;

		const moveResources = article.parsedContent.resourceManager?.setNewBasePath(
			catalog.getRootCategoryRef().path.parentDirectoryPath.subDirectory(newBasePath.parentDirectoryPath),
		);

		const context = this._parserContextFactory.fromArticle(article, catalog, this._rc.lang, this._rc.user.isLogged);

		const udpEditTree = this._updateEditTree(article.parsedContent.editTree, moveResources);
		this._updateInlineMd_component(udpEditTree, moveResources);

		const markdown = await this._formatter.render(udpEditTree, context);
		await article.updateContent(markdown);
	}

	private _updateEditTree(
		editTree: JSONContent,
		moveResources: {
			oldResources: Path[];
			newResources: Path[];
		},
	) {
		let strEditTree = JSON.stringify(editTree);
		moveResources.oldResources.forEach((resource, idx) => {
			strEditTree = strEditTree.replaceAll(`"${resource.value}"`, `"${moveResources.newResources[idx].value}"`);
		});
		return JSON.parse(strEditTree) as JSONContent;
	}

	private _updateInlineMd_component(
		editTree: JSONContent,
		moveResources: {
			oldResources: Path[];
			newResources: Path[];
		},
	) {
		if (editTree?.type == "inlineMd_component") {
			moveResources.oldResources.forEach((resource, idx) => {
				editTree.attrs.text = editTree.attrs.text.replaceAll(
					resource.value,
					moveResources.newResources[idx].value,
				);
			});
		}
		if (editTree?.content) {
			editTree?.content.forEach((e) => {
				this._updateInlineMd_component(e, moveResources);
			});
		}
	}
}

export default ResourceUpdater;
