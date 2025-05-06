import { JSONContent } from "@tiptap/core";
import assert from "assert";
import type { ComponentType, ReactNode } from "react";
import React from "react";
import { RenderableTreeNodes, Scalar } from "../logic/Markdoc";
// import ContentEditor from "../Wysiwyg/ContentEditor";

type Component = ComponentType<unknown>;

export default function Renderer(
	mainNode: RenderableTreeNodes | JSONContent,
	{ components = {} } = {},
	onCreate?: VoidFunction,
) {
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

	function render(node: RenderableTreeNodes | JSONContent): ReactNode {
		if (Array.isArray(node)) return React.createElement(React.Fragment, null, ...node.map(render));
		if (typeof node === "string") return node;
		if (node === null) return null;

		const { name, attributes: { class: className, ...attrs } = {}, children = [] } = getNodeData(node);

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

function getNodeData(node: RenderableTreeNodes | JSONContent) {
	assert(typeof node == "object", "node must be an object and not null");

	const isTag = "children" in node;
	if (isTag) return node;

	if ("type" in node) {
		return {
			name: node.type,
			attributes: node.attrs,
			children: node.content,
		};
	}

	return {};
}

function tagName(
	name: string,
	components: Record<string, Component> | ((string: string) => Component),
): string | Component {
	return typeof name !== "string" ? "div" : components[name] ? components[name] : name;
}
