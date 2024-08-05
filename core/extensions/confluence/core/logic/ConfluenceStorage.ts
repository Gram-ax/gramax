import { CATEGORY_ROOT_FILENAME, DOC_ROOT_FILENAME } from "@app/config/const";
import { transliterate } from "@core-ui/languageConverter/transliterate";
import Path from "@core/FileProvider/Path/Path";
import FileProvider from "@core/FileProvider/model/FileProvider";
import FileStructure from "@core/FileStructue/FileStructure";
import ConfluenceAPI from "@ext/confluence/ConfluenceAPI";
import ConfluenceConverter from "@ext/confluence/actions/Import/logic/ConfluenceConverter";
import { ConfluenceArticle, ConfluenceArticleTree } from "@ext/confluence/core/model/ConfluenceArticle";
import ConfluenceImportData from "@ext/confluence/core/model/ConfluenceImportData";
import ConfluenceStorageData from "@ext/confluence/core/model/ConfluenceStorageData";
import { makeSourceApi } from "@ext/git/actions/Source/makeSourceApi";
import t from "@ext/localization/locale/translate";
import MarkdownFormatter from "@ext/markdown/core/edit/logic/Formatter/Formatter";
import { JSONContent } from "@tiptap/core";

export default class ConfluenceStorage {
	static position: number = 0;

	static async clone({ fp, data, catalogPath }: ConfluenceImportData) {
		fp.stopWatch();
		const formatter = new MarkdownFormatter();
		const fs = new FileStructure(fp, false);
		const converter = new ConfluenceConverter(data, fp);

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
		const articleTree = articles[0];
		if (!articleTree) return;
		const rootPath = new Path(
			`${path.value}/${transliterate(articleTree.title, { kebab: true, maxLength: 50 })}.md`,
		);
		const md = await formatter.render(await converter.convert(articleTree, rootPath));
		const rootContent = fs.serialize({ title: articleTree.title, order: this.position++ }, md);

		if (blogs.length) await this.createBlogs(blogs, path, formatter, converter, fs, fp);

		await fp.write(rootPath, rootContent);
		if (articleTree.children.length) {
			await this.processNode(articleTree, new Path(path.value), formatter, converter, fs, fp);
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

	static async processNode(
		node: ConfluenceArticleTree,
		basePath: Path,
		formatter: MarkdownFormatter,
		converter: ConfluenceConverter,
		fs: FileStructure,
		fp: FileProvider,
	) {
		for (const child of node.children) {
			let path: Path = null;

			if (child.children) {
				path = basePath.join(
					new Path(`${transliterate(child.title, { kebab: true, maxLength: 50 })}/${CATEGORY_ROOT_FILENAME}`),
				);
			} else path = basePath.join(new Path(`${transliterate(child.title, { kebab: true, maxLength: 50 })}.md`));

			const md = await formatter.render(await converter.convert(child, path));
			const content = fs.serialize({ title: child.title, order: this.position++ }, md);

			await fp.write(path, content);
			await this.processNode(child, path.parentDirectoryPath, formatter, converter, fs, fp);
		}
	}

	static formTempNode(article: ConfluenceArticle) {
		const link = this._getPageUrl(article);
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
		const confluenceData = api.getBlogs(data);
		const blogs: ConfluenceArticle[] = (await confluenceData).map((result: any) => ({
			domain: data.source.domain,
			id: result.id,
			linkUi: result._links.webui,
			title: result.title,
			content: JSON.parse(result.body.atlas_doc_format.value) as JSONContent,
		}));
		return blogs;
	}

	static async getConfluenceArticlesTree(data: ConfluenceStorageData): Promise<ConfluenceArticleTree[]> {
		const articles = await this.getConfluenceArticles(data);
		await this.addAllArticles(data, articles);
		return this.buildTree(articles);
	}

	static async getConfluenceArticles(data: ConfluenceStorageData): Promise<ConfluenceArticle[]> {
		const api = makeSourceApi(data.source) as ConfluenceAPI;
		const confluenceData = api.getArticles(data);
		const articles: ConfluenceArticle[] = (await confluenceData).map((result: any) => ({
			domain: data.source.domain,
			id: result.id,
			linkUi: result._links.webui,
			title: result.title,
			position: result.position,
			parentId: result.parentId,
			parentType: result.parentType,
			content: JSON.parse(result.body.atlas_doc_format.value) as JSONContent,
		}));
		return articles;
	}

	static async fetchData(
		data: ConfluenceStorageData,
		parentType: string,
		parentId: string | null,
	): Promise<ConfluenceArticle | null> {
		const api = makeSourceApi(data.source) as ConfluenceAPI;
		const jsonData = await api.getSecondaryElements(parentType, parentId);
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
			content: unsupportedContent,
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

		function buildNodes(parentId: string | null): ConfluenceArticleTree[] {
			const nodes = groupedByParent[parentId || "root"] || [];

			nodes.forEach((node) => {
				node.children = buildNodes(node.id);
			});

			nodes.sort((a, b) => a.position - b.position);

			return nodes;
		}

		return buildNodes(null);
	}

	private static _getPageUrl(article: ConfluenceArticle): string {
		return `${article.domain}/wiki${article.linkUi.replace(/~/g, "%7E")}`;
	}
}
