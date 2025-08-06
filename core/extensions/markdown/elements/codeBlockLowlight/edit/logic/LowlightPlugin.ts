// Source from https://github.com/ueberdosis/tiptap/blob/main/packages/extension-code-block-lowlight/src/lowlight-plugin.ts

import { findChildren } from "@tiptap/core";
import type { Node as ProsemirrorNode } from "@tiptap/pm/model";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { ReplaceAroundStep, ReplaceStep } from "@tiptap/pm/transform";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
import highlight from "highlight.js/lib/core";

function parseNodes(nodes: any[], className: string[] = []): { text: string; classes: string[] }[] {
	return nodes
		.map((node) => {
			const classes = [...className, ...(node.properties ? node.properties.className : [])];

			if (node.children) {
				return parseNodes(node.children, classes);
			}

			return {
				text: node.value,
				classes,
			};
		})
		.flat();
}

function getHighlightNodes(result: any) {
	return result.value || result.children || [];
}

function registered(aliasOrLanguage: string) {
	return Boolean(highlight.getLanguage(aliasOrLanguage));
}

function getDecorations({
	doc,
	name,
	lowlight,
	defaultLanguage,
}: {
	doc: ProsemirrorNode;
	name: string;
	lowlight: any;
	defaultLanguage: string;
}) {
	const decorations: Decoration[] = [];

	findChildren(doc, (node) => node.type.name === name).forEach((block) => {
		let from = block.pos + 1;
		const language = block.node.attrs.language || defaultLanguage;
		const languages = lowlight.listLanguages();

		const nodes =
			language && (languages.includes(language) || registered(language) || lowlight.registered?.(language))
				? getHighlightNodes(lowlight.highlight(language, block.node.textContent))
				: getHighlightNodes(lowlight.highlightAuto(block.node.textContent));

		parseNodes(nodes).forEach((node) => {
			const to = from + node.text.length;

			if (node.classes.length) {
				const decoration = Decoration.inline(from, to, {
					class: node.classes.join(" "),
				});

				decorations.push(decoration);
			}

			from = to;
		});
	});

	return DecorationSet.create(doc, decorations);
}

function isFunction(param: any): param is (...args: any[]) => any {
	return typeof param === "function";
}

export function LowlightPlugin({
	name,
	lowlight,
	defaultLanguage,
}: {
	name: string;
	lowlight: any;
	defaultLanguage: string;
}) {
	if (!["highlight", "highlightAuto", "listLanguages"].every((api) => isFunction(lowlight[api]))) {
		throw Error("You should provide an instance of lowlight to use the code-block-lowlight extension");
	}

	const lowlightPlugin: Plugin<any> = new Plugin({
		key: new PluginKey("lowlight"),

		state: {
			init: (_, { doc }) =>
				getDecorations({
					doc,
					name,
					lowlight,
					defaultLanguage,
				}),
			apply: (transaction, decorationSet, oldState, newState) => {
				const oldNodeName = oldState.selection.$head.parent.type.name;
				const newNodeName = newState.selection.$head.parent.type.name;
				const oldNodes = findChildren(oldState.doc, (node) => node.type.name === name);
				const newNodes = findChildren(newState.doc, (node) => node.type.name === name);
				const meta = transaction.getMeta("forceUpdate");

				const docChanged = transaction.docChanged;
				const nodeNameChanged = [oldNodeName, newNodeName].includes(name);
				const nodesLengthChanged = newNodes.length !== oldNodes.length;
				const stepsChanged = transaction.steps.some((step) => {
					if (!(step instanceof ReplaceAroundStep) && !(step instanceof ReplaceStep)) return false;
					return (
						step.from !== undefined &&
						step.to !== undefined &&
						oldNodes.some((node) => {
							return node.pos >= step.from && node.pos + node.node.nodeSize <= step.to;
						})
					);
				});

				if (meta || (docChanged && (nodeNameChanged || nodesLengthChanged || stepsChanged))) {
					return getDecorations({
						doc: transaction.doc,
						name,
						lowlight,
						defaultLanguage,
					});
				}

				return decorationSet.map(transaction.mapping, transaction.doc);
			},
		},

		props: {
			decorations(state) {
				return lowlightPlugin.getState(state);
			},
		},
	});

	return lowlightPlugin;
}
