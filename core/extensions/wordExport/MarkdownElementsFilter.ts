import { getExecutingEnvironment } from "@app/resolveModule/env";
import t from "@ext/localization/locale/translate";
import { RenderableTreeNode, Tag } from "@ext/markdown/core/render/logic/Markdoc";
import { Display } from "@ext/properties/models/display";
import { JSONContent } from "@tiptap/core";

class MarkdownElementsFilter {
	private _errors: Map<string, number>;

	constructor(private _exportedKeys: Set<string>) {
		this._errors = new Map<string, number>();
	}

	private _isPlainText(tag: Tag | JSONContent): boolean {
		return typeof tag === "string";
	}

	private _findUnsupportedElements(renderTree: Tag | JSONContent): void {
		const renderChildren = "children" in renderTree ? renderTree?.children : renderTree?.content;
		renderChildren.forEach((child) => {
			const tag = child;
			if (!tag || this._isPlainText(tag)) return;

			const name = (("name" in tag && tag.name) || ("type" in tag && tag.type)) as string;
			if (name === "View" && this._exportedKeys?.has(name)) {
				const attrs = "attributes" in tag ? tag.attributes : tag;
				if (attrs.display === Display.Kanban) {
					this._incrementErrorCount(t("pdf.kanban-view-export-error"));
				}
				return;
			}

			if (name === "Mermaid" && getExecutingEnvironment() === "next") {
				this._incrementErrorCount(t("diagram.error.mermaid-export-next-error"));
				return;
			}

			const children = "children" in tag ? tag.children : tag.content;
			if (this._exportedKeys?.has(name)) {
				if (children?.length) this._findUnsupportedElements(tag);
			} else {
				this._incrementErrorCount(name);
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

	public getSupportedTree(node: RenderableTreeNode | JSONContent) {
		return node;
	}
}

export default MarkdownElementsFilter;
