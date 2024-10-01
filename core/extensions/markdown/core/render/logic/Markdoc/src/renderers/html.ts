import MarkdownIt from "markdown-it";
import React from "react";
import { renderToString } from "react-dom/server";
import Renderer from "../../../../components/Renderer";
import type { RenderableTreeNodes } from "../types";
const { escapeHtml } = MarkdownIt().utils;

// HTML elements that do not have a matching close tag
// Defined in the HTML standard: https://html.spec.whatwg.org/#void-elements
const voidElements = new Set([
	"area",
	"base",
	"br",
	"col",
	"embed",
	"hr",
	"img",
	"input",
	"link",
	"meta",
	"param",
	"source",
	"track",
	"wbr",
]);

export default function render(node: RenderableTreeNodes, { components = {} } = {}): string {
	if (typeof node === "string") return escapeHtml(node);

	if (Array.isArray(node)) return node.map((node) => render(node, { components })).join("");

	if (node === null || typeof node !== "object") return "";

	const { name, attributes, children = [] } = node;

	if (!name) return render(children, { components });

	let output = "";
	if (components?.[name]) {
		try {
			const component = React.createElement(components[name], attributes, Renderer(children, { components }));
			output = renderToString(component);
		} catch (error) {
			console.error(`Error rendering component ${name}:`, error);
			output = `<div>Error rendering component ${name}</div>`;
		}
	} else {
		output = `<${name}`;
		for (const [k, v] of Object.entries(attributes ?? {})) output += ` ${k}="${escapeHtml(String(v))}"`;
		output += ">";
	}

	if (voidElements.has(name)) return output;
	if (!components?.[name]) {
		if (children.length) output += render(children, { components });
		output += `</${name}>`;
	}

	return output;
}
