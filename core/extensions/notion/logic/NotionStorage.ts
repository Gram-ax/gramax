import { CATEGORY_ROOT_FILENAME, DOC_ROOT_FILENAME } from "@app/config/const";
import FileProvider from "@core/FileProvider/model/FileProvider";
import Path from "@core/FileProvider/Path/Path";
import FileStructure from "@core/FileStructue/FileStructure";
import { uniqueName } from "@core/utils/uniqueName";
import { transliterate } from "@core-ui/languageConverter/transliterate";
import t from "@ext/localization/locale/translate";
import MarkdownFormatter from "@ext/markdown/core/edit/logic/Formatter/Formatter";
import generateUnsupportedMd from "@ext/markdown/elements/unsupported/logic/generateUnsupportedMd";
import { databaseView } from "@ext/markdown/elements/view/notion/databaseView";
import NotionAPI from "@ext/notion/api/NotionAPI";
import NotionConverter from "@ext/notion/logic/NotionConverter";
import { NotionPropertyManager } from "@ext/notion/logic/NotionPropertyManager";
import NotionImportData from "@ext/notion/model/NotionImportData";
import type NotionSourceData from "@ext/notion/model/NotionSourceData";
import {
	NotionBlock,
	NotionPage,
	NotionProperty,
	NotionPropertyTypes,
	PageNode,
	PathsMapValue,
} from "@ext/notion/model/NotionTypes";
import { PropertyValue } from "@ext/properties/models";
import type { ProxiedSourceDataCtx } from "@ext/storage/logic/SourceDataProvider/logic/SourceDataCtx";
import { JSONContent } from "@tiptap/core";
import * as yaml from "js-yaml";

export default class NotionStorage {
	static async clone({ fs, data, catalogPath }: NotionImportData) {
		fs.fp.stopWatch();
		const formatter = new MarkdownFormatter();
		const converter = new NotionConverter(data.source, fs.fp);

		try {
			if (await fs.fp?.exists(catalogPath)) {
				return;
			}

			const notionApi = new NotionAPI(data.source);
			const pageTree = await this.getNotionPageTree(notionApi);
			const pm = new NotionPropertyManager(pageTree);
			await this._createArticles(pageTree, catalogPath, formatter, converter, fs, fs.fp, pm);
			await fs.fp.write(
				catalogPath.join(new Path(DOC_ROOT_FILENAME)),
				yaml.dump({ title: data.source.workspaceName, properties: pm.cleanProperties }, { quotingType: '"' }),
			);
		} catch (e) {
			await (data.source as ProxiedSourceDataCtx<NotionSourceData>).assertValid?.(e);
			throw e;
		} finally {
			fs.fp?.startWatch();
		}
	}

	static async getNotionPageTree(notionApi: NotionAPI): Promise<PageNode[]> {
		const allPages = await notionApi.getAllPages();
		const catalogTitles = [];

		const pageMap: { [id: string]: PageNode } = {};

		const pages: PageNode[] = await Promise.all(
			allPages.map((item: NotionPage) => this._processPage(item, notionApi, pageMap, catalogTitles)),
		);
		const rootPages: PageNode[] = [];
		pages.forEach((page) => {
			if (!page) return;
			if (page.parent_id) {
				const parentPage = pageMap[page.parent_id];
				if (parentPage && !parentPage.children.some((child) => child.id === page.id)) {
					parentPage.children.push(page);
				}
			} else {
				rootPages.push(page);
			}
		});

		return rootPages;
	}

	private static async _createArticles(
		pageTree: PageNode[],
		basePath: Path,
		formatter: MarkdownFormatter,
		converter: NotionConverter,
		fs: FileStructure,
		fp: FileProvider,
		pm: NotionPropertyManager,
	) {
		const pathsMap = this._createPathsMap(pageTree, basePath);

		for (const page of pageTree) {
			let articleProperties: PropertyValue[] = [];

			if (page.type === "database") {
				this._processDatabaseContent(page, pm);
				page.children.reverse();
			}

			if (page.type === "page") {
				articleProperties = pm.getArticleProperties(page.properties);
				this._processFilesToPageContent(page);
			}

			const pageData = pathsMap.get(page.id);
			if (!pageData) continue;

			const { pagePath } = pageData;
			const md = await this._processContent(page, pagePath, pathsMap, converter, formatter);

			const content = fs.serialize({
				props: { title: page.title, order: pageTree.indexOf(page), properties: articleProperties },
				content: md,
			});

			await fp.write(pagePath, content);

			if (page.children?.length > 0) {
				const nextBasePath = pagePath.parentDirectoryPath;
				await this._createArticles(page.children, nextBasePath, formatter, converter, fs, fp, pm);
			}
		}
	}

	private static async _processContent(
		page: PageNode,
		pagePath: Path,
		pathsMap: Map<string, PathsMapValue>,
		converter: NotionConverter,
		formatter: MarkdownFormatter,
	): Promise<string> {
		let json: JSONContent;
		try {
			json = await converter.convert(page, pagePath, pathsMap);
			return await formatter.render(json);
		} catch (error) {
			const jsonString = json ? JSON.stringify(json, null, 2) : null;
			console.error(t("import.error.page-conversion"), {
				title: page.title,
				id: page.id,
				error: error.message,
				stack: error.stack,
				json: jsonString,
			});
			return generateUnsupportedMd("Notion", page.url, "page", error.stack, jsonString);
		}
	}

	private static _processDatabaseContent(page: PageNode, pm: NotionPropertyManager): void {
		const matchedNames = pm.properties
			.filter((customProperty) =>
				Object.values(page.properties).some((property) => customProperty.id.includes(property.id)),
			)
			.map((customProperty) => customProperty.name);

		const databaseContent: Partial<NotionBlock>[] = databaseView(page.description, matchedNames);
		page.content = databaseContent as NotionBlock[];
	}

	private static _createPathsMap(
		pageTree: PageNode[],
		basePath: Path,
	): Map<string, { title: string; pagePath: Path }> {
		const pathsMap = new Map<string, { title: string; pagePath: Path }>();

		const processPage = (page: PageNode, parentPath: Path) => {
			const transliteratedTitle = transliterate(page.title, { kebab: true, maxLength: 50 });
			const hasChildren = page.children?.length > 0;

			const pagePath = parentPath.join(
				new Path(`${transliteratedTitle}${hasChildren ? `/${CATEGORY_ROOT_FILENAME}` : ".md"}`),
			);

			pathsMap.set(page.id, { title: page.title, pagePath });

			if (page.children?.length > 0) {
				const nextBasePath = hasChildren ? pagePath.parentDirectoryPath : pagePath;
				page.children.forEach((child) => processPage(child, nextBasePath));
			}
		};

		pageTree.forEach((page) => processPage(page, basePath));

		return pathsMap;
	}

	private static async _processPage(
		item: NotionPage,
		notionApi: NotionAPI,
		pageMap: { [id: string]: PageNode },
		catalogTitles: string[],
	): Promise<PageNode> {
		let title =
			(Array.isArray(item?.title) ? item?.title[0]?.plain_text : item?.title?.plain_text) ||
			Object.values(item?.properties).find((prop: NotionProperty) => prop.id === "title")?.title?.[0]
				?.plain_text ||
			"Untitled";

		title = uniqueName(title, catalogTitles);
		catalogTitles.push(title);

		const page: PageNode = {
			id: item.id,
			title,
			url: item.url,
			type: item.object,
			description: item.description,
			properties: item.properties,
			last_edited_time: item.last_edited_time,
			content: [],
			children: [],
			parent_id: item.parent.page_id || item.parent.database_id || item.parent.block_id,
		};

		pageMap[page.id] = page;

		page.content = await this._getPageContent(item.id, notionApi, pageMap, item.id);

		return page;
	}

	private static async _getPageContent(
		pageId: string,
		notionApi: NotionAPI,
		pageMap: { [id: string]: PageNode },
		rootPageId: string,
	): Promise<NotionBlock[]> {
		const content = await notionApi.getContent(pageId);
		return Promise.all(
			content.map((block: NotionBlock) => this._processBlock(block, notionApi, pageMap, rootPageId)),
		);
	}

	private static async _processBlock(
		block: NotionBlock,
		notionApi: NotionAPI,
		pageMap: { [id: string]: PageNode },
		rootPageId: string,
	): Promise<NotionBlock> {
		if (block.type === "child_page" || block.type === "child_database") {
			const childPage = pageMap[block.id];
			if (childPage && !pageMap[rootPageId].children.some((child) => child.id === block.id)) {
				pageMap[rootPageId].children.push(childPage);
			}
			return block;
		}

		block.content = [];

		if (block.has_children) block.content = await this._getPageContent(block.id, notionApi, pageMap, rootPageId);

		return block;
	}

	private static _processFilesToPageContent(page: PageNode): void {
		const fileGroups = Object.entries(page.properties)
			.filter(([, property]: [string, NotionProperty]) => property.type === NotionPropertyTypes.Files)
			.map(([key, property]) => ({
				key,
				files: property?.[property.type].filter((file: NotionBlock) => file.type === "file"),
			}));
		const divider: Partial<NotionBlock> = {
			type: "divider",
		};

		if (!fileGroups.length) return;

		page.content.unshift(divider as NotionBlock);
		fileGroups.reverse().forEach((group) => {
			if (group.files.length > 0) {
				group.files.forEach((file) => {
					file.inline = true;
				});

				const groupParagraph: Partial<NotionBlock> = {
					type: "gramaxParagraph",
					content: [
						{
							type: "text",
							plain_text: `${group.key}: `,
						},
						...group.files,
					],
				};

				page.content.unshift(groupParagraph as NotionBlock);
			}
		});
	}
}
