import { getExecutingEnvironment } from "@app/resolveModule/env";
import t from "@ext/localization/locale/translate";
import { RenderableTreeNode, Tag } from "@ext/markdown/core/render/logic/Markdoc";
import { Display } from "@ext/properties/models/displays";

class MarkdownElementsFilter {
	private _errors: Map<string, number>;

	constructor(private _exportedKeys: Set<string>) {
		this._errors = new Map<string, number>();
	}

	private _findUnsupportedElements(renderTree: Tag): void {
		renderTree.children.forEach((child) => {
			const tag = child as Tag;

			if (tag.name === "View" && this._exportedKeys?.has(tag.name)) {
				if (tag.attributes.display === Display.Kanban) {
					this._incrementErrorCount(t("pdf.kanban-view-export-error"));
				}
				return;
			}

			if (tag.name === "Mermaid" && getExecutingEnvironment() === "next") {
				this._incrementErrorCount(t("diagram.error.mermaid-export-next-error"));
				return;
			}

			if (this._exportedKeys?.has(tag.name)) {
				if (tag.children?.length) this._findUnsupportedElements(tag);
			} else {
				this._incrementErrorCount(tag.name);
			}
		});
	}

	private _incrementErrorCount(errorKey: string): void {
		if (this._errors.has(errorKey)) {
			this._errors.set(errorKey, this._errors.get(errorKey) + 1);
		} else {
			this._errors.set(errorKey, 1);
		}
	}

	public getUnsupportedElements(renderTree: Tag) {
		this._errors = new Map<string, number>();
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
