import { CATEGORY_ROOT_FILENAME, DOC_ROOT_FILENAME } from "@app/config/const";
import { transliterate } from "@core-ui/languageConverter/transliterate";
import Path from "@core/FileProvider/Path/Path";
import FileProvider from "@core/FileProvider/model/FileProvider";
import FileStructure from "@core/FileStructue/FileStructure";
import ConfluenceConverter from "@ext/confluence/core/model/ConfluenceConverter";
import ConfluenceAPI from "@ext/confluence/core/api/model/ConfluenceAPI";
import generateConfluenceArticleLink from "@ext/confluence/core/logic/generateConfluenceArticleLink";
import { ConfluenceArticle, ConfluenceArticleTree } from "@ext/confluence/core/model/ConfluenceArticle";
import ConfluenceImportData from "@ext/confluence/core/model/ConfluenceImportData";
import ConfluenceStorageData from "@ext/confluence/core/model/ConfluenceStorageData";
import { makeSourceApi } from "@ext/git/actions/Source/makeSourceApi";
import t from "@ext/localization/locale/translate";
import MarkdownFormatter from "@ext/markdown/core/edit/logic/Formatter/Formatter";
import SourceType from "@ext/storage/logic/SourceDataProvider/model/SourceType";
import { JSONContent } from "@tiptap/core";
import makeConfluenceConvertor from "@ext/confluence/core/logic/makeConfluenceConvertor";
import ConfluenceCloudAPI from "@ext/confluence/core/api/ConfluenceCloudAPI";
import ConfluenceCloudSourceData from "@ext/confluence/core/cloud/model/ConfluenceCloudSourceData";

export default class ConfluenceStorage {
	static position: number = 0;

	static async clone({ fp, data, catalogPath }: ConfluenceImportData) {
		fp.stopWatch();
		const formatter = new MarkdownFormatter();
		const fs = new FileStructure(fp, false);
		const converter = makeConfluenceConvertor[data.source.sourceType](data.source, fp);
		try {
			if (await fp?.exists(catalogPath)) {
				return;
			}
			await fp.write(catalogPath.join(new Path(DOC_ROOT_FILENAME)), `title: ${data.displayName}`);
			const blogs: ConfluenceArticle[] = await this.getConfluenceBlogs(data);
			const articles: ConfluenceArticleTree[] = await this.getConfluenceArticlesTree(data);
			await this.createArticles(articles, blogs, catalogPath, formatter, converter, fs, fp);
		} finally {
			fp?.startWatch();
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

		const md = await formatter.render(await converter.convert(node, currentPath));
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
			const md = await formatter.render(await converter.convert(blog, blogPath));
			const content = fs.serialize({ title: blog.title, order: blogPosition-- }, md);
			await fp.write(blogPath, content);
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
