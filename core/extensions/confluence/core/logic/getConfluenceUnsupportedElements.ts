import getCloudConvertors from "@ext/confluence/core/cloud/logic/getCloudConvertors";
import getServerConvertors from "@ext/confluence/core/server/logic/getServerConvertors";
import CONFLUENCE_EXTENSION_TYPES from "@ext/confluence/core/cloud/model/confluenceExtensionTypes";
import generateConfluenceArticleLink from "@ext/confluence/core/logic/generateConfluenceArticleLink";
import { ConfluenceArticle, ConfluenceArticleTree } from "@ext/confluence/core/model/ConfluenceArticle";
import UnsupportedElements from "@ext/import/model/UnsupportedElements";
import { JSONContent } from "@tiptap/core";
import SourceType from "@ext/storage/logic/SourceDataProvider/model/SourceType";

const unsupportedElements: Map<string, UnsupportedElements> = new Map();

const processUnsupportedNode = (article: ConfluenceArticle, nodeType: string, isCloud = true) => {
	if (!unsupportedElements.has(article.id)) {
		unsupportedElements.set(article.id, {
			article: {
				id: article.id,
				title: article.title,
				link: generateConfluenceArticleLink(article, isCloud),
			},
			elements: [],
		});
	}

	const articleData = unsupportedElements.get(article.id);
	const elementArray = articleData.elements;

	const existingElement = elementArray.find((element) => element.name === nodeType);
	existingElement ? existingElement.count++ : elementArray.push({ name: nodeType, count: 1 });
};

const collectUnsupportedNodes = (
	articles: ConfluenceArticle[],
	isTree: boolean,
	traverseFn: (content: any, article: ConfluenceArticle) => void,
) => {
	articles.forEach((article) => {
		traverseFn(article.content, article);

		if (isTree) {
			const treeArticle = article as ConfluenceArticleTree;
			if (treeArticle.children) {
				collectUnsupportedNodes(treeArticle.children, true, traverseFn);
			}
		}
	});
};

const checkContentJSON = (content: JSONContent, article: ConfluenceArticle, conversionMap: Record<string, any>) => {
	if (!content) return;

	const nodeType =
		CONFLUENCE_EXTENSION_TYPES.includes(content.type) && content.attrs?.extensionKey
			? content.attrs.extensionKey
			: content.type;

	if (!conversionMap[nodeType]) return processUnsupportedNode(article, nodeType);

	if (content.content) {
		content.content.forEach((child) => checkContentJSON(child, article, conversionMap));
	}
};

const checkHTMLElement = (element: HTMLElement, article: ConfluenceArticle, conversionMap: Record<string, any>) => {
	if (!element) return;

	let nodeType = element.tagName.toLowerCase();

	if (nodeType === "ac:structured-macro") {
		nodeType = element.getAttribute("ac:name") ?? nodeType;
	}

	if (!conversionMap[nodeType]) return processUnsupportedNode(article, nodeType.replace(":", "-"), false);

	Array.from(element.children).forEach((child) => checkHTMLElement(child as HTMLElement, article, conversionMap));
};

const getConfluenceUnsupportedElements = (
	blogs: ConfluenceArticle[],
	articles: ConfluenceArticleTree[],
	sourceType: SourceType,
): UnsupportedElements[] => {
	unsupportedElements.clear();

	const conversionMap = sourceType === SourceType.confluenceCloud ? getCloudConvertors() : getServerConvertors();

	let checkNode;

	if (sourceType === SourceType.confluenceCloud) {
		checkNode = (content: any, article: ConfluenceArticle) => {
			checkContentJSON(JSON.parse(content), article, conversionMap);
		};
	} else {
		checkNode = (content: any, article: ConfluenceArticle) => {
			const parser = new DOMParser();
			const doc = parser.parseFromString(content, "text/html");
			checkHTMLElement(doc.body, article, conversionMap);
		};
	}

	collectUnsupportedNodes(blogs, false, checkNode);
	collectUnsupportedNodes(articles, true, checkNode);

	return Array.from(unsupportedElements.values());
};

export default getConfluenceUnsupportedElements;
