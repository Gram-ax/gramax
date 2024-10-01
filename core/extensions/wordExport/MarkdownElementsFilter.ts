import { RenderableTreeNode, Tag } from "@ext/markdown/core/render/logic/Markdoc";

class MarkdownElementsFilter {
	private _errors: Map<string, number>;

	constructor(private _exportedKeys: Set<string>) {
		this._errors = new Map<string, number>();
	}

	private _findUnsupportedElements(renderTree: Tag): void {
		renderTree.children.forEach((child) => {
			const tag = child as Tag;
			if (this._exportedKeys?.has(tag.name)) {
				if (tag.children?.length) this._findUnsupportedElements(tag);
			} else if (this._errors.has(tag.name)) this._errors.set(tag.name, this._errors.get(tag.name) + 1);
			else this._errors.set(tag.name, 1);
		});
	}

	public getUnsupportedElements(renderTree: Tag) {
		this._errors.clear();
		this._findUnsupportedElements(renderTree);
		return this._errors;
	}

	public getSupportedTree(node: RenderableTreeNode) {
		if (node === null || node === undefined || typeof node === "string" || node.$$mdtype !== "Tag") return node;
		return new Tag(
			node.name,
			node.attributes,
			node.children
				.map((child) => this.getSupportedTree(child))
				.filter((val) => this._exportedKeys.has(val.name)),
		);
	}
}

export default MarkdownElementsFilter;
