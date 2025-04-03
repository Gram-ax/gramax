import { CATEGORY_ROOT_FILENAME, DOC_ROOT_FILENAME } from "@app/config/const";
import { transliterate } from "@core-ui/languageConverter/transliterate";
import Path from "@core/FileProvider/Path/Path";
import FileProvider from "@core/FileProvider/model/FileProvider";
import FileStructure from "@core/FileStructue/FileStructure";
import ConfluenceCloudAPI from "@ext/confluence/core/api/ConfluenceCloudAPI";
import ConfluenceAPI from "@ext/confluence/core/api/model/ConfluenceAPI";
import ConfluenceCloudSourceData from "@ext/confluence/core/cloud/model/ConfluenceCloudSourceData";
import generateConfluenceArticleLink from "@ext/confluence/core/logic/generateConfluenceArticleLink";
import makeConfluenceConvertor from "@ext/confluence/core/logic/makeConfluenceConvertor";
import { ConfluenceArticle, ConfluenceArticleTree } from "@ext/confluence/core/model/ConfluenceArticle";
import ConfluenceConverter from "@ext/confluence/core/model/ConfluenceConverter";
import ConfluenceImportData from "@ext/confluence/core/model/ConfluenceImportData";
import type ConfluenceSourceData from "@ext/confluence/core/model/ConfluenceSourceData";
import ConfluenceStorageData from "@ext/confluence/core/model/ConfluenceStorageData";
import { makeSourceApi } from "@ext/git/actions/Source/makeSourceApi";
import t from "@ext/localization/locale/translate";
import MarkdownFormatter from "@ext/markdown/core/edit/logic/Formatter/Formatter";
import generateUnsupportedMd from "@ext/markdown/elements/unsupported/logic/generateUnsupportedMd";
import type { ProxiedSourceDataCtx } from "@ext/storage/logic/SourceDataProvider/logic/SourceDataCtx";
import SourceType from "@ext/storage/logic/SourceDataProvider/model/SourceType";
import { JSONContent } from "@tiptap/core";

export default class ConfluenceStorage {
	static position: number = 0;

	static async clone({ fs, data, catalogPath }: ConfluenceImportData) {
		fs.fp.stopWatch();
		const formatter = new MarkdownFormatter();
		const converter = makeConfluenceConvertor[data.source.sourceType](data.source, fs.fp);
		try {
			if (await fs.fp?.exists(catalogPath)) {
				return;
			}
			await fs.fp.write(catalogPath.join(new Path(DOC_ROOT_FILENAME)), `title: ${data.displayName}`);
			const blogs: ConfluenceArticle[] = await this.getConfluenceBlogs(data);
			const articles: ConfluenceArticleTree[] = await this.getConfluenceArticlesTree(data);
			await this.createArticles(articles, blogs, catalogPath, formatter, converter, fs, fs.fp);
		} catch (e) {
			await (data.source as ProxiedSourceDataCtx<ConfluenceSourceData>).assertValid?.(e);
		} finally {
			fs.fp?.startWatch();
		}
	}

	static async createArticles(
		articles: ConfluenceArticleTree[],
		blogs: ConfluenceArticle[],
		path: Path,
		formatter: MarkdownFormatter,
		converter: ConfluenceConverter,
		fs: FileStructure,
		fp: FileProvider,
	) {
		if (!articles || articles.length === 0) return;

		if (blogs.length) {
			await this.createBlogs(blogs, path, formatter, converter, fs, fp);
		}

		for (const articleTree of articles) {
			await this.processNode(articleTree, path, formatter, converter, fs, fp);
		}
	}

	static async processNode(
		node: ConfluenceArticleTree,
		basePath: Path,
		formatter: MarkdownFormatter,
		converter: ConfluenceConverter,
		fs: FileStructure,
		fp: FileProvider,
	) {
		const transliteratedTitle = transliterate(node.title, { kebab: true, maxLength: 50 });
		const hasChildren = node.children?.length > 0;
		const currentPath = basePath.join(
			new Path(`${transliteratedTitle}${hasChildren ? `/${CATEGORY_ROOT_FILENAME}` : ".md"}`),
		);

		const md = await this._processContent(node, currentPath, converter, formatter);
		const content = fs.serialize({ title: node.title, order: this.position++ }, md);

		await fp.write(currentPath, content);

		if (hasChildren) {
			const nextBasePath = currentPath.parentDirectoryPath;
			for (const child of node.children) {
				await this.processNode(child, nextBasePath, formatter, converter, fs, fp);
			}
		}
	}

	static async createBlogs(
		blogs: ConfluenceArticle[],
		path: Path,
		formatter: MarkdownFormatter,
		converter: ConfluenceConverter,
		fs: FileStructure,
		fp: FileProvider,
	) {
		const blogsPath = new Path(`${path.value}/blogs/${CATEGORY_ROOT_FILENAME}`);
		const content = fs.serialize({ title: t("confluence.blogs"), order: this.position++ }, "");
		await fp.write(blogsPath, content);
		let blogPosition = blogs.length;
		for (const blog of blogs) {
			const blogPath = new Path(
				`${path.value}/blogs/${transliterate(blog.title, { kebab: true, maxLength: 50 })}.md`,
			);
			const md = await this._processContent(blog, blogPath, converter, formatter);
			const content = fs.serialize({ title: blog.title, order: blogPosition-- }, md);
			await fp.write(blogPath, content);
		}
	}

	private static async _processContent(
		article: ConfluenceArticle,
		currentPath: Path,
		converter: ConfluenceConverter,
		formatter: MarkdownFormatter,
	): Promise<string> {
		let json: JSONContent;
		try {
			json = await converter.convert(article, currentPath);
			return await formatter.render(json);
		} catch (error) {
			const jsonString = json ? JSON.stringify(json, null, 2) : null;
			console.error(t("import.error.page-conversion"), {
				title: article.title,
				id: article.id,
				error: error.message,
				stack: error.stack,
				json: jsonString,
			});
			const pageUrl = article.domain + article.linkUi;

			return generateUnsupportedMd("Confluence", pageUrl, "page", error.stack, jsonString);
		}
	}

	static formTempNode(article: ConfluenceArticle) {
		const link = generateConfluenceArticleLink(article);
		const tempNode: JSONContent = {
			type: "doc",
			content: [
				{
					type: "paragraph",
					content: [
						{
							type: "text",
							marks: [
								{
									type: "link",
									attrs: {
										href: link,
										resourcePath: "",
										hash: "",
										isFile: false,
									},
								},
							],
							text: link,
						},
					],
				},
			],
		};
		return tempNode;
	}

	static async getConfluenceBlogs(data: ConfluenceStorageData): Promise<ConfluenceArticle[]> {
		const api = makeSourceApi(data.source) as ConfluenceAPI;
		return await api.getBlogs(data);
	}

	static async getConfluenceArticlesTree(data: ConfluenceStorageData): Promise<ConfluenceArticleTree[]> {
		const articles = await this.getConfluenceArticles(data);
		if (data.source.sourceType === SourceType.confluenceCloud) await this.addAllArticles(data, articles);
		return this.buildTree(articles);
	}

	static async getConfluenceArticles(data: ConfluenceStorageData): Promise<ConfluenceArticle[]> {
		const api = makeSourceApi(data.source) as ConfluenceAPI;
		return await api.getArticles(data);
	}

	static async fetchData(
		data: ConfluenceStorageData,
		parentType: string,
		parentId: string,
	): Promise<ConfluenceArticle> {
		const api = new ConfluenceCloudAPI(data.source as ConfluenceCloudSourceData);
		const jsonData = await api.getSecondaryElements(parentType, parentId);
		if (!jsonData) return;
		const unsupportedContent: JSONContent = {
			type: "doc",
			content: [
				{
					type: "paragraph",
					content: [
						{
							type: "text",
							text: t("confluence.link-board"),
							marks: [
								{
									type: "link",
									attrs: {
										href: `${jsonData._links.base + jsonData._links.webui}`,
									},
								},
							],
						},
					],
				},
			],
		};
		const article: ConfluenceArticle = {
			domain: data.source.domain,
			id: jsonData.id,
			linkUi: jsonData._links.webui,
			title: jsonData.title,
			position: jsonData.position,
			parentId: jsonData.parentId,
			parentType: jsonData.parentType,
			content: JSON.stringify(unsupportedContent),
		};

		return article;
	}

	static async addAllArticles(data: ConfluenceStorageData, articles: ConfluenceArticle[]) {
		for (const article of articles) {
			if (article.parentType === "whiteboard") {
				const fetchedArticle = await this.fetchData(data, article.parentType, article.parentId);
				if (fetchedArticle) {
					articles.push(fetchedArticle);
				}
			}
		}
	}

	static buildTree(articles: ConfluenceArticle[]): ConfluenceArticleTree[] {
		const groupedByParent: { [key: string]: ConfluenceArticleTree[] } = {};

		articles.forEach((article) => {
			const parentId = article.parentId || "root";
			if (!groupedByParent[parentId]) {
				groupedByParent[parentId] = [];
			}
			groupedByParent[parentId].push({ ...article, children: [] });
		});

		function buildNodes(parentId: string): ConfluenceArticleTree[] {
			const nodes = groupedByParent[parentId] || [];
			nodes.forEach((node) => {
				node.children = buildNodes(node.id);
			});
			nodes.sort((a, b) => a.position - b.position);
			return nodes;
		}

		const rootNodes = buildNodes("root");

		return rootNodes;
	}
}
