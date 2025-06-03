import { dump } from "js-yaml";
import { basename, join } from "path";
import { DOMAIN } from "../../../utils/predefinedValues";
import ChalkLogger from "../../../utils/ChalkLogger";
import Article, { ArticleProps, ArticleItem, Articles, Resource } from "./entities/article";
import FetchActions from "./FetchActions";
import { InternalPath } from "./utils";
import FileProvider from "./entities/fileProvider";
import Replacer from "./Replacer/replacer";
import ResourceReplacer from "./Replacer/resourceReplacer";

export interface DocRootProps {
	title: string;
	description: string;
	name: string;
}

interface CreateArticleProps extends ArticleProps {
	path: string;
}

const getPathsFromMdLink = (filePath: string, articleName: string) => {
	const fileName = articleName + "-" + basename(filePath);
	const folderPath = filePath.split(".files")[0] || "";
	const folderPathToHasChildren = folderPath.split("/").filter(Boolean).join("/");
	const folderPathWithoutHasChildren = folderPath.split("/").filter(Boolean).slice(0, -1).join("/");

	return { fileName, folderPathToHasChildren, folderPathWithoutHasChildren };
};

const getPathBySlug = (slug: string, fileName: string, hasChildren: boolean) => {
	const pathToArticleFolder = hasChildren ? slug : slug.split("/").filter(Boolean).slice(0, -1).join("/");
	const filePath = join(pathToArticleFolder, fileName);

	return { filePath };
};

function hasHttp(url: string) {
	return /^(https?:\/\/)/.test(url);
}

class GXCore {
	createDocRoot(data: DocRootProps) {
		const path = "doc-root.yaml";
		const yamlContent = dump(data);

		FileProvider.writeYaml(path, yamlContent);
	}

	createContentFolders() {
		FileProvider.createDir(InternalPath.pathToOut, false);
		FileProvider.createDir(InternalPath.pathToContent, false);
	}

	createWorkspaceYaml() {
		if (!FileProvider.exist(join(InternalPath.pathToContent, "../", "workspace.yaml"))) {
			const data = {
				name: "yandex-wiki",
				icon: "a-arrow-up",
				groups: null,
				gesUrl: null,
				isEnterprise: false,
				services: {
					gitProxy: { url: "https://develop.gram.ax/git-proxy" },
					auth: { url: "https://develop.gram.ax/auth" },
					diagramRenderer: { url: "https://dev.gram.ax/-server/diagram-renderer" },
					review: { url: "https://develop.gram.ax/review" },
				},
			};

			const yamlContent = dump(data);

			FileProvider.writeYaml(join("../", "workspace.yaml"), yamlContent);
		}
	}

	createArticleTo({ path, ...articleProps }: CreateArticleProps) {
		const articleData = Article.getArticleData(articleProps);
		const { articlePath, folderPath } = FileProvider.getArticlePath(path);

		FileProvider.createDir(folderPath);
		FileProvider.writeMarkdown(articlePath, articleData);
	}

	createIndexArticle({ path, ...articleProps }: CreateArticleProps) {
		const articleData = Article.getArticleData(articleProps);
		const { articlePath, folderPath } = FileProvider.getIndexArticlePaths(path);

		FileProvider.createDir(folderPath);
		FileProvider.writeMarkdown(articlePath, articleData);
	}

	createCatalogFromArticlesData(data: Articles, raw: boolean) {
		if (!raw) this.createDocRoot({ title: "yandex.wiki", description: "Импортированный каталог", name: "" });
		const articles: ArticleItem[] = Object.values(data);

		while (articles.length) {
			const article = articles.pop();
			if (!Article.validateArticle(article).haveMainAttr) continue;

			const props = {
				path: article.slug,
				order: 1,
				title: article.title,
				markdown: article.content,
			};

			if (article.has_children) this.createIndexArticle(props);
			else this.createArticleTo(props);
		}
	}

	injectResources(articles: Articles, raw: boolean): Articles {
		const items = Object.keys(articles).map(Number);
		const stack = [...items];

		while (stack.length) {
			const itemId = stack.pop();
			const item = articles[itemId];
			const name = item.name;

			const resources: Resource[] = [];
			let content = item.content;
			if (!Article.validateArticle(item).correctContent) continue;

			const { resources: DiagramsResources, content: WithDiagramContent } = ResourceReplacer.diagramsReplacer(
				content,
				name,
				item.slug,
			);

			content = raw ? content : WithDiagramContent;
			if (DiagramsResources.length) resources.push(...DiagramsResources);

			const { resources: FileResources, content: WithFileContent } = ResourceReplacer.fileReplacer(content, name);
			content = raw ? content : WithFileContent;
			if (FileResources.length) resources.push(...FileResources);

			const { resources: ImageResources, content: WithImageContent } = ResourceReplacer.imageReplacer(
				content,
				name,
			);
			content = raw ? content : WithImageContent;
			if (ImageResources.length) resources.push(...ImageResources);

			if (!raw) delete item.html;
			item.content = content;
			item.resources = resources;
		}

		return articles;
	}

	transformUnsupported(articles: Articles, raw: boolean): Articles {
		if (raw) return articles;
		const items = Object.keys(articles).map(Number);

		const stack = [...items];

		while (stack.length) {
			const itemId = stack.pop();
			const item = articles[itemId];
			if (!Article.validateArticle(item).correctContent) continue;

			let content = item.content;

			const url = DOMAIN + item.slug + "/";
			content = ResourceReplacer.temporarilyUnsupportedReplace(content, url);
			content = ResourceReplacer.unsupportedReplace(content, url);

			item.content = content;
		}

		return articles;
	}

	transformContent(articles: Articles, raw: boolean): Articles {
		if (raw) return articles;

		const items = Object.keys(articles).map(Number);
		const stack = [...items];

		while (stack.length) {
			const itemId = stack.pop();
			const item = articles[itemId];
			if (!Article.validateArticle(item).correctContent) continue;

			let content = item.content;

			content = Replacer.replaceInlineMark(content);
			content = Replacer.replaceNotes(content);
			content = Replacer.replaceCuts(content);
			content = Replacer.replaceIframe(content);
			content = Replacer.replaceCheckBox(content);
			content = Replacer.replaceTabs(content);
			content = Replacer.transformTable(content);
			content = Replacer.relocateInlineImages(content);

			content = Replacer.postReplace(content);

			item.content = content;
		}

		return articles;
	}

	async downloadResources(articles: Articles): Promise<void> {
		const items = Object.keys(articles).map(Number);
		const stack = [...items];
		let processedCount = 0;
		const totalResources = items.reduce((acc, itemId) => acc + articles[itemId].resources.length, 0);

		while (stack.length) {
			const itemId = stack.pop();
			const item = articles[itemId];
			if (!Article.validateArticle(item).haveMainAttr) continue;

			const articleName = item.name;
			const isIndexArticle = item.has_children;

			if (!item.resources.length) continue;

			const diagramStack = [...item.resources].filter(({ type }) => ["diagram"].includes(type));
			const internalStack = [...item.resources].filter(({ type }) => ["file", "image"].includes(type));

			while (diagramStack.length) {
				const { src, content = "" } = diagramStack.pop();
				const { filePath } = getPathBySlug(item.slug, src, item.has_children);

				try {
					if (content || typeof content === "string") {
						FileProvider.writeFileAsync(content, filePath, src);
					}
				} catch (e) {
					console.log(e);
				} finally {
					processedCount += 1;
					ChalkLogger.write(`\rDownloaded resources: ${processedCount}/${totalResources}`);
				}
			}

			while (internalStack.length) {
				const resource = internalStack.pop();
				const path = resource.src;

				if (hasHttp(path)) {
					processedCount += 1;
					ChalkLogger.write(`\rDownloaded resources: ${processedCount}/${totalResources}`);
					continue;
				}

				const slicePath = path.slice(1);
				const { folderPathWithoutHasChildren, folderPathToHasChildren, fileName } = getPathsFromMdLink(
					path,
					articleName,
				);

				try {
					const stream = await FetchActions.downloadFile(slicePath);
					if (stream === null) throw new Error("Body is null");

					await FileProvider.writeFile(
						stream,
						isIndexArticle ? folderPathToHasChildren : folderPathWithoutHasChildren,
						fileName,
					);
				} catch (e) {
					console.log(e);
				} finally {
					processedCount += 1;
					ChalkLogger.write(`\rDownloaded resources: ${processedCount}/${totalResources}`);
				}
			}
		}

		ChalkLogger.deletePrevLine();
	}
}

export default GXCore;
