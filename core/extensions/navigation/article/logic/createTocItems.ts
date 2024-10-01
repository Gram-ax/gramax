import { Node } from "prosemirror-model";
import { RenderableTreeNode } from "../../../markdown/core/render/logic/Markdoc";
import getChildTextId from "../../../markdown/elements/heading/logic/getChildTextId";

export interface TocItem {
	url: string;
	title: string;
	items: TocItem[];
}

export interface LevelTocItem {
	url: string;
	title: string;
	level: number;
	items: TocItem[];
}

export const collapseTocItems = (tocItems: TocItem[]) => {
	const result = [];
	const stack = [...tocItems];

	while (stack.length) {
		const item = stack.pop();
		result.push({ ...item, items: [] });
		if (item.items.length) item.items.forEach((i) => stack.push(i));
	}

	return result;
};

const getTocItems = (tocItems: LevelTocItem[]): TocItem[] => {
	const stack: LevelTocItem[] = [];
	const result: LevelTocItem[] = [];
	for (const item of tocItems) {
		const newItem = {
			level: item.level,
			title: item.title,
			url: item.url,
			items: [],
		};
		while (stack.length > 0 && stack[stack.length - 1].level >= newItem.level) {
			stack.pop();
		}
		if (stack.length > 0) {
			stack[stack.length - 1].items.push(newItem);
		} else {
			result.push(newItem);
		}
		stack.push(newItem);
	}
	return result;
};

export const getLevelTocItemsByRenderableTree = (tags: RenderableTreeNode[]): LevelTocItem[] => {
	const items: LevelTocItem[] = [];
	tags.forEach((tag) => {
		if (tag && typeof tag !== "string" && tag.name == "Include") {
			items.push(...getLevelTocItemsByRenderableTree(tag.children));
		}
		if (!tag || typeof tag === "string" || tag.name !== "Heading") return;
		if (tag?.attributes?.level == 4 || tag?.attributes?.level == 3 || tag?.attributes?.level == 2) {
			items.push({
				level: +tag.attributes.level,
				url: "#" + tag.attributes.id,
				title: tag.attributes.title,
				items: [],
			});
		}
	});
	return items;
};

export const getLevelTocItemsByJSONContent = (node: Node): LevelTocItem[] => {
	const items: LevelTocItem[] = [];

	const pushItem = (n: Node) => {
		if (n?.attrs?.level == 4 || n?.attrs?.level == 3 || n?.attrs?.level == 2) {
			items.push({
				level: +n.attrs.level,
				url: "#" + (n.attrs.id ?? getChildTextId(n.textContent)),
				title: n.textContent,
				items: [],
			});
		}
	};

	node.content.forEach((n) => {
		if (n?.type?.name == "comment" && n?.firstChild?.type?.name == "heading") pushItem(n.firstChild);
		if (!n || n.type.name !== "heading") return;
		pushItem(n);
	});

	return items;
};

export default getTocItems;
