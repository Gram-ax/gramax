import ResourceMovements from "@core/Resource/models/ResourceMovements";
import { JSONContent } from "@tiptap/core";
import MarkdownParser from "../../extensions/markdown/core/Parser/Parser";
import ParserContextFactory from "../../extensions/markdown/core/Parser/ParserContext/ParserContextFactory";
import MarkdownFormatter from "../../extensions/markdown/core/edit/logic/Formatter/Formatter";
import Context from "../Context/Context";
import { Article } from "../FileStructue/Article/Article";
import parseContent from "../FileStructue/Article/parseContent";
import { Catalog } from "../FileStructue/Catalog/Catalog";

class ResourceUpdater {
	constructor(
		private _rc: Context,
		private _catalog: Catalog,
		private _parser: MarkdownParser,
		private _parserContextFactory: ParserContextFactory,
		private _formatter: MarkdownFormatter,
	) {}

	async update(oldArticle: Article, newArticle: Article) {
		await parseContent(oldArticle, this._catalog, this._rc, this._parser, this._parserContextFactory, false);
		if (!oldArticle?.parsedContent) return;

		const { resourceManager, linkManager } = oldArticle.parsedContent;
		const newResourceBasePath = this._catalog
			.getRootCategoryRef()
			.path.parentDirectoryPath.subDirectory(newArticle.ref.path.parentDirectoryPath);

		const resourceMovements = {
			oldResources: resourceManager.setNewBasePath(newResourceBasePath).oldResources,
			newResources: (await resourceManager.move(oldArticle.ref.path, newArticle.ref.path)).newResources,
		};

		const linkMovements = linkManager.setNewBasePath(newResourceBasePath);

		const allMovements = {
			oldResources: [...resourceMovements.oldResources, ...linkMovements.oldResources],
			newResources: [...resourceMovements.newResources, ...linkMovements.newResources],
		};

		const newEditTree = this._updateEditTree(oldArticle.parsedContent.editTree, allMovements);
		this._updateInInlineMdComponent(newEditTree, allMovements);

		const context = this._parserContextFactory.fromArticle(
			newArticle,
			this._catalog,
			this._rc.lang,
			this._rc.user.isLogged,
		);
		const markdown = await this._formatter.render(newEditTree, context);
		await newArticle.updateContent(markdown);
	}

	private _updateEditTree(editTree: JSONContent, moveResources: ResourceMovements) {
		let strEditTree = JSON.stringify(editTree);
		moveResources.oldResources.forEach((resource, idx) => {
			strEditTree = strEditTree.replaceAll(`"${resource.value}"`, `"${moveResources.newResources[idx].value}"`);
		});
		return JSON.parse(strEditTree) as JSONContent;
	}

	private _updateInInlineMdComponent(editTree: JSONContent, moveResources: ResourceMovements) {
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
				this._updateInInlineMdComponent(e, moveResources);
			});
		}
	}
}

export default ResourceUpdater;
