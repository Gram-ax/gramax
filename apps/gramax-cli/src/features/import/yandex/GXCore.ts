import { dump } from "js-yaml";
import ChalkLogger from "../../../utils/ChalkLogger";
import Article, { ArticleItem, ArticleProps, Articles, Resource } from "./entities/article";
import DownloadResource from "./entities/downloadResource";
import FileProvider from "./entities/fileProvider";
import LinkTransformer from "./Replacer/linkReplacer";
import Replacer from "./Replacer/replacer";
import ResourceReplacer from "./Replacer/resourceReplacer";
import { InternalPath } from "./utils";

export interface DocRootProps {
	title: string;
	description: string;
	name: string;
}

interface CreateArticleProps extends ArticleProps {
	path: string;
}

class GXCore {
	createDocRoot(data: DocRootProps) {
		const path = "doc-root.yaml";
		const yamlContent = dump(data);

		FileProvider.writeYaml(path, yamlContent);
	}

	createContentFolders() {
		FileProvider.createDir(InternalPath.pathToOutDir, false);
		FileProvider.createDir(InternalPath.pathToContentDir, false);
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
		const itemIds = Object.keys(articles).map(Number);

		for (const itemId of itemIds) {
			const item = articles[itemId];
			if (!Article.validateArticle(item).correctContent) continue;

			const name = item.name;
			let content = item.content;
			const allResources: Resource[] = [];

			const processed = ResourceReplacer.applyResourceReplacers(content, name, item.slug, raw);
			content = processed.content;
			allResources.push(...processed.resources);

			if (!raw) delete item.html;
			item.content = content;
			item.resources = allResources;
		}

		return articles;
	}

	transformUnsupported(articles: Articles, raw: boolean): Articles {
		if (raw) return articles;

		const itemIds = Object.keys(articles).map(Number);

		for (const itemId of itemIds) {
			const item = articles[itemId];
			if (!Article.validateArticle(item).correctContent) continue;

			item.content = ResourceReplacer.applyUnsupportedReplacers(item.content, item.slug);
		}

		return articles;
	}

	transformContent(articles: Articles, raw: boolean): Articles {
		if (raw) return articles;

		const itemIds = Object.keys(articles).map(Number);

		for (const itemId of itemIds) {
			const item = articles[itemId];
			if (!Article.validateArticle(item).correctContent) continue;

			item.content = Replacer.applyReplacers(item.content);
		}

		LinkTransformer.transformLinks(articles);

		return articles;
	}

	async downloadResources(articles: Articles): Promise<void> {
		const itemIds = Object.keys(articles).map(Number);
		const totalResources = DownloadResource.calculateTotalResources(articles, itemIds);
		let processedCount = 0;

		for (const itemId of itemIds) {
			const item = articles[itemId];
			if (!Article.validateArticle(item).haveMainAttr || !item.resources.length) continue;

			const diagramResources = DownloadResource.filterResourcesByType(item.resources, ["diagram"]);
			const fileAndImageResources = DownloadResource.filterResourcesByType(item.resources, ["file", "image"]);

			const logMessage = () => {
				processedCount += 1;
				ChalkLogger.write(`\rDownloaded resources: ${processedCount}/${totalResources}`);
			};

			DownloadResource.processDiagramResources(diagramResources, item.has_children, logMessage);

			await DownloadResource.processFileAndImageResources(
				fileAndImageResources,
				item.name,
				item.has_children,
				logMessage,
			);
		}

		ChalkLogger.deletePrevLine();
	}
}

export default GXCore;
