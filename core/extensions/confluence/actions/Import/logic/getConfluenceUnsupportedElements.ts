import getConvertors from "@ext/confluence/actions/Import/logic/getConvertors";
import UnsupportedElements from "@ext/confluence/actions/Import/model/UnsupportedElements";
import CONFLUENCE_EXTENSION_TYPES from "@ext/confluence/actions/Import/model/confluenceExtensionTypes";
import generateConfluenceArticleLink from "@ext/confluence/core/logic/generateConfluenceArticleLink";
import { ConfluenceArticle, ConfluenceArticleTree } from "@ext/confluence/core/model/ConfluenceArticle";
import { JSONContent } from "@tiptap/core";

const unsupportedElements: Map<string, UnsupportedElements> = new Map();

const conversionMap = getConvertors();

const isNodeSupported = (type: string, attrs?: Record<string, any>): boolean => {
	if (CONFLUENCE_EXTENSION_TYPES.includes(type) && attrs?.extensionKey) {
		return !!conversionMap[attrs.extensionKey];
	}
	return !!conversionMap[type];
};

const processUnsupportedNode = (article: ConfluenceArticle, nodeType: string) => {
	if (!unsupportedElements.has(article.id)) {
		unsupportedElements.set(article.id, {
			article: {
				id: article.id,
				title: article.title,
				link: generateConfluenceArticleLink(article),
			},
			elements: [],
		});
	}
	const articleData = unsupportedElements.get(article.id);
	const elementArray = articleData.elements;

	const existingElement = elementArray.find((element) => element.name === nodeType);
	if (existingElement) {
		existingElement.count += 1;
	} else {
		elementArray.push({ name: nodeType, count: 1 });
	}
};

const traverseContent = (content: JSONContent, article: ConfluenceArticle) => {
	if (!content) return;

	const nodeType =
		CONFLUENCE_EXTENSION_TYPES.includes(content.type) && content.attrs?.extensionKey
			? content.attrs.extensionKey
			: content.type;

	if (!isNodeSupported(content.type, content.attrs)) {
		processUnsupportedNode(article, nodeType);
		return;
	}

	if (content.content) {
		content.content.forEach((child) => traverseContent(child, article));
	}
};

const collectUnsupportedNodes = (articles: ConfluenceArticle[], isTree: boolean) => {
	articles.forEach((article) => {
		traverseContent(article.content, article);
		if (isTree) {
			const treeArticle = article as ConfluenceArticleTree;
			if (treeArticle.children) {
				collectUnsupportedNodes(treeArticle.children, true);
			}
		}
	});
};

const getConfluenceUnsupportedElements = (
	blogs: ConfluenceArticle[],
	articles: ConfluenceArticleTree[],
): UnsupportedElements[] => {
	unsupportedElements.clear();

	collectUnsupportedNodes(blogs, false);
	collectUnsupportedNodes(articles, true);

	return Array.from(unsupportedElements.values());
};

export default getConfluenceUnsupportedElements;
