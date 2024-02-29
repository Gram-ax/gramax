import type { ComponentType, ReactNode } from "react";
import React from "react";
import { EditRenderableTreeNode } from "../../Parser/Parser";
import { RenderableTreeNodes, Scalar, Tag } from "../logic/Markdoc";
// import ContentEditor from "../Wysiwyg/ContentEditor";

type Component = ComponentType<unknown>;

export default function Renderer(mainNode: RenderableTreeNodes, { components = {} } = {}, onCreate?: VoidFunction) {
	function deepRender(value: any): any {
		if (value == null || typeof value !== "object") return value;
		if (Array.isArray(value)) return value.map(deepRender);

		if (value.$$mdtype === "Tag") return render(value);

		if (typeof value !== "object") return value;

		const output: Record<string, Scalar> = {};
		for (const [k, v] of Object.entries(value)) output[k] = deepRender(v);
		onCreate?.();
		return output;
	}

	function render(node: RenderableTreeNodes | EditRenderableTreeNode): ReactNode {
		if (Array.isArray(node)) return React.createElement(React.Fragment, null, ...node.map(render));
		if (typeof node === "string") return node;
		if (node === null) return null;

		const { name, attributes: { class: className, ...attrs } = {}, children = [] } = node as Tag;

		if (className) attrs.className = className;

		return React.createElement(
			tagName(name, components),
			Object.keys(attrs).length == 0 ? null : deepRender(attrs),
			...children.map(render),
		);
	}

	if (!mainNode) return null;
	return render(mainNode);
}

function tagName(
	name: string,
	components: Record<string, Component> | ((string: string) => Component),
): string | Component {
	return typeof name !== "string" ? "div" : name[0] !== name[0].toUpperCase() ? name : components[name];
}
