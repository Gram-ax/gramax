import { DOMAIN } from "../../../../utils/predefinedValues";
import type { ArticleItem, Articles } from "../entities/article";

class LinkTransformer {
	private readonly _linkRegex = /\[([^\]]+)\]\((https:\/\/wiki\.yandex\.ru\/[^)]+)\)/g;
	private readonly baseUrl = DOMAIN;

	private extractSlugFromUrl(url: string): string {
		return url.replace(this.baseUrl, "").replace(/\/$/, "");
	}

	private findArticleBySlug(articles: Articles, targetSlug: string): ArticleItem | null {
		for (const article of Object.values(articles)) {
			if (article.slug === targetSlug) return article;
		}

		return null;
	}

	private getCurrentArticleDirectory(article: ArticleItem): string[] {
		const slugParts = article.slug.split("/");

		if (article.has_children) {
			return slugParts;
		} else {
			return slugParts.slice(0, -1);
		}
	}

	private getTargetArticleFilePath(targetArticle: ArticleItem): string[] {
		const slugParts = targetArticle.slug.split("/");

		if (targetArticle.has_children) {
			return [...slugParts, "_index"];
		} else {
			const articleName = slugParts[slugParts.length - 1];
			return [...slugParts.slice(0, -1), articleName];
		}
	}

	private calculateRelativePath(currentArticle: ArticleItem, targetArticle: ArticleItem): string {
		const currentDir = this.getCurrentArticleDirectory(currentArticle);
		const targetFilePath = this.getTargetArticleFilePath(targetArticle);

		let commonLength = 0;
		const minLength = Math.min(currentDir.length, targetFilePath.length);

		for (let i = 0; i < minLength; i++) {
			if (currentDir[i] === targetFilePath[i]) {
				commonLength++;
			} else {
				break;
			}
		}

		if (commonLength === currentDir.length && commonLength === targetFilePath.length - 1) {
			const fileName = targetFilePath[targetFilePath.length - 1];
			return "./" + fileName;
		}

		const upLevels = currentDir.length - commonLength;

		const remainingPath = targetFilePath.slice(commonLength);

		const relativeParts: string[] = [];

		for (let i = 0; i < upLevels; i++) {
			relativeParts.push("..");
		}

		relativeParts.push(...remainingPath);

		if (relativeParts.length === 0) return "./";

		const relativePath = relativeParts.join("/");

		if (!relativePath.startsWith("../")) return "./" + relativePath;

		return relativePath;
	}

	private transformSingleLink(currentArticle: ArticleItem, linkUrl: string, articles: Articles): string {
		const targetSlug = this.extractSlugFromUrl(linkUrl);
		const targetArticle = this.findArticleBySlug(articles, targetSlug);

		if (!targetArticle) return linkUrl;

		return this.calculateRelativePath(currentArticle, targetArticle);
	}

	private linkReplacer(sourceText: string, currentArticle: ArticleItem, articles: Articles): { content: string } {
		let content = sourceText;

		content = content.replace(this._linkRegex, (match, linkText, linkUrl) => {
			const relativePath = this.transformSingleLink(currentArticle, linkUrl, articles);

			if (relativePath === linkUrl) return match;

			return `[${linkText}](${relativePath})`;
		});

		return { content };
	}

	public transformLinks(articles: Articles): Articles {
		const itemIds = Object.keys(articles).map(Number);

		for (const itemId of itemIds) {
			const article = articles[itemId];

			if (!article.content) continue;

			const { content } = this.linkReplacer(article.content, article, articles);
			article.content = content;
		}

		return articles;
	}

	public transformLinksForSingleArticle(article: ArticleItem, articles: Articles): ArticleItem {
		if (!article.content) return article;

		const { content } = this.linkReplacer(article.content, article, articles);

		return {
			...article,
			content,
		};
	}
}

export default new LinkTransformer();
