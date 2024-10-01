import Path from "@core/FileProvider/Path/Path";
import { ItemRef } from "@core/FileStructue/Item/ItemRef";
import ResourceMovements from "@core/Resource/models/ResourceMovements";
import { convertContentToUiLanguage } from "@ext/localization/locale/translate";
import { JSONContent } from "@tiptap/core";
import MarkdownParser from "../../extensions/markdown/core/Parser/Parser";
import ParserContextFactory from "../../extensions/markdown/core/Parser/ParserContext/ParserContextFactory";
import MarkdownFormatter from "../../extensions/markdown/core/edit/logic/Formatter/Formatter";
import Context from "../Context/Context";
import { Article } from "../FileStructue/Article/Article";
import parseContent from "../FileStructue/Article/parseContent";
import { Catalog } from "../FileStructue/Catalog/Catalog";
import ParseError from "@ext/markdown/core/Parser/Error/ParseError";

export default class ResourceUpdater {
	constructor(
		private _rc: Context,
		private _catalog: Catalog,
		private _parser: MarkdownParser,
		private _parserContextFactory: ParserContextFactory,
		private _formatter: MarkdownFormatter,
	) {}

	async updateOtherArticles(oldPath: Path, absoluteNewBasePath: Path, innerRefs?: ItemRef[]) {
		for (const item of this._catalog
			.getContentItems()
			.filter((item) => !innerRefs?.some((ref) => ref.path.compare(item.ref.path)))) {
			const oldResources: Path[] = [];
			const newResources: Path[] = [];

			if (!item.parsedContent)
				try {
					await parseContent(item, this._catalog, this._rc, this._parser, this._parserContextFactory, false);
				} catch (e) {
					if (e instanceof ParseError) return;
					throw e;
				}

			const parsedContent = item.parsedContent;
			parsedContent.linkManager.resources.map((resource) => {
				const absolutePath = parsedContent.linkManager.getAbsolutePath(resource);

				if (absolutePath.value !== oldPath.value) return;
				oldResources.push(resource);
				newResources.push(item.ref.path.getRelativePath(absoluteNewBasePath));
			});
			if (!oldResources.length) continue;

			const newEditTree = this._updateEditTree(parsedContent.editTree, { oldResources, newResources });
			parsedContent.editTree = newEditTree;
			this._updateInInlineMdComponent(newEditTree, { oldResources, newResources });

			const context = this._parserContextFactory.fromArticle(
				item,
				this._catalog,
				convertContentToUiLanguage(this._rc.contentLanguage),
				this._rc.user.isLogged,
			);
			const markdown = await this._formatter.render(newEditTree, context);
			await item.updateContent(markdown);
			item.parsedContent = parsedContent;
		}
	}

	async update(oldArticle: Article, newArticle: Article, innerRefs?: ItemRef[]) {
		try {
			await parseContent(oldArticle, this._catalog, this._rc, this._parser, this._parserContextFactory, false);
		} catch (e) {
			if (e instanceof ParseError) return;
			throw e;
		}

		if (!oldArticle?.parsedContent) return;

		const { resourceManager, linkManager } = oldArticle.parsedContent;
		const newResourceBasePath = this._catalog
			.getRootCategoryRef()
			.path.parentDirectoryPath.subDirectory(newArticle.ref.path.parentDirectoryPath);

		const resourceMovements = {
			oldResources: resourceManager.setNewBasePath(newResourceBasePath).oldResources,
			newResources: (await resourceManager.move(oldArticle.ref.path, newArticle.ref.path)).newResources,
		};

		const linkMovements = linkManager.setNewBasePath(
			newResourceBasePath,
			innerRefs?.map((pathToMove) => pathToMove.path),
		);

		const allMovements = {
			oldResources: [...resourceMovements.oldResources, ...linkMovements.oldResources],
			newResources: [...resourceMovements.newResources, ...linkMovements.newResources],
		};

		const newEditTree = this._updateEditTree(oldArticle.parsedContent.editTree, allMovements);
		this._updateInInlineMdComponent(newEditTree, allMovements);

		const context = this._parserContextFactory.fromArticle(
			newArticle,
			this._catalog,
			convertContentToUiLanguage(this._rc.contentLanguage || this._catalog.props.language),
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
