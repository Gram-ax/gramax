import UnsupportedElements from "@ext/import/model/UnsupportedElements";
import getNotionConvertors from "@ext/notion/logic/getNotionConverters";
import { NotionBlock, PageNode } from "@ext/notion/model/NotionTypes";

const unsupportedElements: Map<string, UnsupportedElements> = new Map();

const processUnsupportedBlock = (page: PageNode, blockType: string) => {
	if (!unsupportedElements.has(page.id)) {
		unsupportedElements.set(page.id, {
			article: {
				id: page.id,
				title: page.title,
				link: page.url,
			},
			elements: [],
		});
	}
	const pageData = unsupportedElements.get(page.id);
	const elementArray = pageData.elements;

	if (blockType === "unsupported") blockType = "link_to_page/button";

	const existingElement = elementArray.find((element) => element.name === blockType);
	existingElement ? existingElement.count++ : elementArray.push({ name: blockType, count: 1 });
};

const traverseBlocks = (blocks: NotionBlock[], page: PageNode, conversionMap: Record<string, any>) => {
	if (!blocks) return;

	blocks.forEach((block) => {
		const blockType = block.type;
		if (!conversionMap[blockType]) {
			processUnsupportedBlock(page, blockType);
		}

		if (block.has_children && block.content && block.content.length > 0) {
			traverseBlocks(block.content, page, conversionMap);
		}
	});
};

const collectUnsupportedBlocks = (pages: PageNode[], conversionMap: Record<string, any>) => {
	pages.forEach((page) => {
		traverseBlocks(page.content, page, conversionMap);
		if (page.children && page.children.length > 0) {
			collectUnsupportedBlocks(page.children, conversionMap);
		}
	});
};

const getNotionUnsupportedElements = (pageTree: PageNode[]): UnsupportedElements[] => {
	unsupportedElements.clear();
	const conversionMap = getNotionConvertors();
	collectUnsupportedBlocks(pageTree, conversionMap);
	return Array.from(unsupportedElements.values());
};

export default getNotionUnsupportedElements;
