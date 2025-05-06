import { Node } from "prosemirror-model";
import { RenderableTreeNode } from "../../../markdown/core/render/logic/Markdoc";
import getChildTextId from "../../../markdown/elements/heading/logic/getChildTextId";
import { JSONContent } from "@tiptap/core";

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

const recursiveGetText = (tag: RenderableTreeNode | JSONContent): string[] => {
	if (typeof tag === "string") return [tag];
	if ("children" in tag) return tag.children.flatMap((c) => recursiveGetText(c));
	if ("content" in tag) return tag.content.flatMap((c) => recursiveGetText(c));
	return [""];
};

export const getLevelTocItemsByRenderableTree = (tags: RenderableTreeNode[] | JSONContent[]): LevelTocItem[] => {
	const items: LevelTocItem[] = [];
	tags.forEach((tag) => {
		const name = "name" in tag ? tag.name : tag.type;
		if (tag && name == "Include") {
			items.push(...getLevelTocItemsByRenderableTree("children" in tag ? tag.children : tag.content));
		}
		if (!tag || typeof tag === "string" || name !== "Heading") return;

		const attrs = "attributes" in tag ? tag.attributes : tag.attrs;
		if (attrs?.level == 4 || attrs?.level == 3 || attrs?.level == 2) {
			const text = recursiveGetText(tag).join("");
			const textId = getChildTextId(text);

			items.push({
				level: +attrs.level,
				url: "#" + (attrs.id ?? textId),
				title: attrs.title ?? text,
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
