import type { OpenApiNavigation } from "@ext/markdown/elements/openApi/edit/logic/buildNavigationFromSpec";
import type { JSONContent } from "@tiptap/core";
import type { Node } from "prosemirror-model";
import type { RenderableTreeNode } from "../../../markdown/core/render/logic/Markdoc";
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
	isOpenApi?: boolean;
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
		if (item.isOpenApi) {
			const stackItem = stack.length ? stack[stack.length - 1].items : result;
			stackItem.push(item);
			continue;
		}

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

const getOpenaApiItems = (navigation: OpenApiNavigation[]) => {
	const items: LevelTocItem[] = [];
	navigation.forEach((tag) => {
		const childItems = tag.child.map((item) => ({
			url: `#${item.id}`,
			title: item.title,
			items: [],
		}));

		items.push({
			level: 0,
			url: `#${tag.id}`,
			title: tag.title,
			items: childItems,
			isOpenApi: true,
		});
	});
	return items;
};

export const getLevelTocItemsByRenderableTree = (tags: RenderableTreeNode[] | JSONContent[]): LevelTocItem[] => {
	const items: LevelTocItem[] = [];

	const recursiveTraversal = (tag: RenderableTreeNode | JSONContent) => {
		if (typeof tag !== "object") return;

		const name = "name" in tag ? tag.name : tag.type;
		const attrs = "attributes" in tag ? tag.attributes : tag.attrs;

		if (name === "Heading" && (attrs?.level === 4 || attrs?.level === 3 || attrs?.level === 2)) {
			const text = recursiveGetText(tag).join("");

			items.push({
				level: +attrs.level,
				url: `#${attrs.id?.length ? attrs.id : getChildTextId(text)}`,
				title: attrs.title ?? text,
				items: [],
			});
		}

		if (name === "OpenApi" && attrs.navigation) items.push(...getOpenaApiItems(attrs.navigation));

		const children = "children" in tag ? tag.children : tag.content;
		if (children) children.forEach((child) => recursiveTraversal(child));
	};

	if (!tags || !Array.isArray(tags)) return items;
	tags?.forEach((tag) => recursiveTraversal(tag));

	return items;
};

export const getLevelTocItemsByJSONContent = (
	node: Node,
	openApiTocItems: Record<string, OpenApiNavigation[]>,
): LevelTocItem[] => {
	const items: LevelTocItem[] = [];

	const pushItem = (n: Node) => {
		if (n?.attrs?.level === 4 || n?.attrs?.level === 3 || n?.attrs?.level === 2) {
			items.push({
				level: +n.attrs.level,
				url: `#${n.attrs.id ?? getChildTextId(n.textContent)}`,
				title: n.textContent,
				items: [],
			});
		}
	};

	const recursivePushItem = (n: Node) => {
		const name = n?.type?.name;
		if (name === "comment" && n?.firstChild?.type?.name === "heading") recursivePushItem(n.firstChild);
		if (name === "heading") pushItem(n);
		if (name === "fragment" && n.attrs.content) items.push(...getLevelTocItemsByRenderableTree(n.attrs.content));

		if (name === "openapi" && openApiTocItems[n.attrs.src])
			items.push(...getOpenaApiItems(openApiTocItems[n.attrs.src]));

		n?.content?.forEach((n) => {
			recursivePushItem(n);
		});
	};

	node.content.forEach((n) => {
		recursivePushItem(n);
	});

	return items;
};

export default getTocItems;
