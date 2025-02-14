import { RenderableTreeNode, Tag } from "@ext/markdown/core/render/logic/Markdoc";
import { DocumentTree } from "@ext/pdfExport/buildDocumentTree";
import { blockLayouts, inlineLayouts } from "@ext/pdfExport/layouts";
import { addMargin } from "@ext/pdfExport/utils/addMargin";
import { HEADING_MARGINS } from "@ext/pdfExport/config";
import { pdfImageConverter } from "@ext/pdfExport/pdfImageProcessor";
import { Content } from "pdfmake/interfaces";
import { errorCase } from "@ext/pdfExport/utils/getErrorElement";
import { isTag } from "@ext/pdfExport/utils/isTag";

export interface NodeOptions {
	colWidth?: number;
}

async function handleNode(
	node: RenderableTreeNode,
	level: number,
	prevNode: RenderableTreeNode | null,
	options?: NodeOptions,
): Promise<Content[]> {
	if (!isTag(node)) {
		return [];
	}

	const caseHandler = blockLayouts[node.name] || inlineLayouts[node.name];
	if (node.name === "p") {
		if (Array.isArray(node.children) && node.children.length > 0) {
			const firstChild = node.children[0];

			if (isTag(firstChild) && firstChild.name === "Image") {
				const content = await blockLayouts["Image"](firstChild, level, options);
				const margin = addMargin(prevNode, node.name, firstChild);
				return margin ? [margin, content] : [content];
			}
		}
	}

	if (caseHandler) {
		const content = await caseHandler(node, level, options);
		const margin = addMargin(prevNode, node.name, node);
		return margin ? [margin, content] : [content];
	}
	return [];
}

export async function parseNodeToPDFContent(
	node: RenderableTreeNode,
	level = 0,
	options?: NodeOptions,
): Promise<Content[]> {
	const results: Content[] = [];

	if (!isTag(node)) {
		return results;
	}

	if (!Array.isArray(node.children)) {
		return results;
	}

	let prevNode: RenderableTreeNode | null = null;

	for (const currentNode of node.children) {
		try {
			const content = await handleNode(currentNode, level, prevNode, options);
			results.push(...content);
			prevNode = currentNode;
		} catch (error) {
			results.push(errorCase(currentNode));
		}
	}

	return results;
}

export async function handleDocumentTree(nodes: DocumentTree[]): Promise<Content[]> {
	const results: Content[] = [];
	const margins = HEADING_MARGINS["H1"];

	const node = nodes[0];

	results.push({
		text: node.name,
		style: "H1",
		margin: [0, 0, 0, margins.bottom],
	});

	if (node.content) {
		const imageConverter = new pdfImageConverter(node.resourceManager);
		await imageConverter.convertImagesToBase64(node.content as Tag);
		const contentResults = await parseNodeToPDFContent(node.content);
		results.push(...contentResults);
	}

	if (node.children && node.children.length > 0) {
		results.push({ text: "", pageBreak: "after" });
		for (let i = 0; i < node.children.length; i++) {
			const child = node.children[i];
			const childResults = await handleDocumentTree([child]);
			results.push(...childResults);

			if (i < node.children.length - 1) {
				results.push({ text: "", pageBreak: "after" });
			}
		}
	}

	return results;
}
