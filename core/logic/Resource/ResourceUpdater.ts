import type Path from "@core/FileProvider/Path/Path";
import type { ReadonlyCatalog } from "@core/FileStructue/Catalog/ReadonlyCatalog";
import type { ItemRef } from "@core/FileStructue/Item/ItemRef";
import type ResourceMovements from "@core/Resource/models/ResourceMovements";
import { convertContentToUiLanguage } from "@ext/localization/locale/translate";
import { Level, span, trace } from "@ext/loggers/opentelemetry";
import ParseError from "@ext/markdown/core/Parser/Error/ParseError";
import type { JSONContent } from "@tiptap/core";
import type MarkdownFormatter from "../../extensions/markdown/core/edit/logic/Formatter/Formatter";
import type MarkdownParser from "../../extensions/markdown/core/Parser/Parser";
import type ParserContextFactory from "../../extensions/markdown/core/Parser/ParserContext/ParserContextFactory";
import type Context from "../Context/Context";
import type { Article } from "../FileStructue/Article/Article";
import parseContent from "../FileStructue/Article/parseContent";

export default class ResourceUpdater {
	constructor(
		private _rc: Context,
		private _catalog: ReadonlyCatalog,
		private _parser: MarkdownParser,
		private _parserContextFactory: ParserContextFactory,
		private _formatter: MarkdownFormatter,
	) {}

	@trace({ level: Level.Internal })
	async updateOtherArticles(oldPath: Path, absoluteNewBasePath: Path, innerRefs?: ItemRef[]) {
		await this.updateOtherArticlesBatch([{ oldPath, newPath: absoluteNewBasePath }], innerRefs);
	}

	@trace({ level: Level.Internal })
	async updateOtherArticlesBatch(movements: { oldPath: Path; newPath: Path }[], innerRefs?: ItemRef[]) {
		if (!movements.length) return;

		const movementMap = new Map(movements.map((m) => [m.oldPath.value, m.newPath]));

		const itemsToUpdate = this._catalog
			.getContentItems()
			.filter((item) => !innerRefs?.some((ref) => ref.path.compare(item.ref.path)));

		for (const item of itemsToUpdate) {
			const oldResources: Path[] = [];
			const newResources: Path[] = [];

			try {
				await parseContent(item, this._catalog, this._rc, this._parser, this._parserContextFactory);
			} catch (e) {
				if (!(e instanceof ParseError)) throw e;
				span()?.addEvent("updateOtherArticles-parseContentFailed", { path: item.ref.path.value });
				continue;
			}

			await item.parsedContent.write(async (p) => {
				if (!p) return p;

				p.parsedContext.getLinkManager().resources.forEach((resource) => {
					const absolutePath = p.parsedContext.getLinkManager().getAbsolutePath(resource);
					const newPath = movementMap.get(absolutePath.value);
					if (!newPath) return;
					oldResources.push(resource);
					newResources.push(item.ref.path.getRelativePath(newPath));
				});
				if (!oldResources.length) return p;

				const newEditTree = this._updateEditTree(p.editTree, { oldResources, newResources });
				p.editTree = newEditTree;
				this._updateInInlineMdComponent(newEditTree, { oldResources, newResources });

				const context = await this._parserContextFactory.fromArticle(
					item,
					this._catalog,
					convertContentToUiLanguage(this._rc.contentLanguage),
				);
				const markdown = await this._formatter.render(newEditTree, context);
				await item.updateContent(markdown, false);
				return null;
			});
		}
	}

	@trace({ level: Level.Internal })
	async update(oldArticle: Article, newArticle: Article, innerRefs?: ItemRef[]) {
		try {
			await parseContent(oldArticle, this._catalog, this._rc, this._parser, this._parserContextFactory);
		} catch (e) {
			if (e instanceof ParseError) return;
			throw e;
		}

		if (await oldArticle?.parsedContent.isNull()) return;

		await oldArticle.parsedContent.write(async (p) => {
			const resourceManager = p.parsedContext.getResourceManager();
			const linkManager = p.parsedContext.getLinkManager();

			const newResourceBasePath = this._catalog.basePath.subDirectory(newArticle.ref.path.parentDirectoryPath);

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

			const newEditTree = this._updateEditTree(p.editTree, allMovements);
			this._updateInInlineMdComponent(newEditTree, allMovements);

			const context = await this._parserContextFactory.fromArticle(
				newArticle,
				this._catalog,
				convertContentToUiLanguage(this._rc.contentLanguage || this._catalog.props.language),
			);
			const markdown = await this._formatter.render(newEditTree, context);
			await newArticle.updateContent(markdown, false);
			return p;
		});
	}

	private _updateEditTree(editTree: JSONContent, moveResources: ResourceMovements): JSONContent {
		let strEditTree = JSON.stringify(editTree);

		moveResources.oldResources.forEach((resource, idx) => {
			strEditTree = strEditTree.replaceAll(`"${resource.value}"`, `"${moveResources.newResources[idx].value}"`);
		});
		return JSON.parse(strEditTree) as JSONContent;
	}

	private _updateInInlineMdComponent(editTree: JSONContent, moveResources: ResourceMovements) {
		if (editTree?.type === "inlineMd_component") {
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
