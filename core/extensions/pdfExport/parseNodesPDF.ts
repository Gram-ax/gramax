import { RenderableTreeNode } from "@ext/markdown/core/render/logic/Markdoc";
import { addMargin } from "@ext/pdfExport/utils/addMargin";
import { HEADING_MARGINS } from "@ext/pdfExport/config";
import { Content } from "pdfmake/interfaces";
import { errorCase } from "@ext/pdfExport/utils/getErrorElement";
import { isTag } from "@ext/pdfExport/utils/isTag";
import DocumentTree from "@ext/wordExport/DocumentTree/DocumentTree";
import { TitleInfo } from "@ext/wordExport/options/WordTypes";
import ParserContext from "@ext/markdown/core/Parser/ParserContext/ParserContext";
import { generateBookmarkName } from "@ext/wordExport/generateBookmarkName";
import ContextualCatalog from "@core/FileStructue/Catalog/ContextualCatalog";
import { ItemFilter } from "@core/FileStructue/Catalog/Catalog";
import { CatalogProps } from "@core/FileStructue/Catalog/CatalogProps";
import getLayout from "@ext/pdfExport/utils/getLayout";
import { JSONContent } from "@tiptap/core";

export interface NodeOptions {
	level?: number;
	colWidth?: number;
}

export interface pdfRenderContext {
	titlesMap: Map<string, TitleInfo>;
	parserContext: ParserContext;
	articleName: string;
	order: string;
	headingMap: Map<string, number>;
	catalog: ContextualCatalog<CatalogProps>;
	itemFilters: ItemFilter[];
}

async function handleNode(
	node: RenderableTreeNode | JSONContent,
	prevNode: RenderableTreeNode | JSONContent,
	context: pdfRenderContext,
	options?: NodeOptions,
): Promise<Content[]> {
	if (typeof node === "object" && !isTag(node) && !("type" in node)) {
		return [];
	}

	if (typeof node === "string") {
		return [];
	}

	const name = "name" in node ? node.name : node.type;

	const caseHandler = getLayout(name);
	const children = "children" in node ? node.children : node.content;
	if (name === "p") {
		if (Array.isArray(children) && children.length > 0) {
			const firstChild = children[0];
			const firstChildName =
				typeof firstChild === "object" && "name" in firstChild ? firstChild.name : firstChild.type;

			if (
				(isTag(firstChild) ||
					(typeof firstChild === "object" && "type" in firstChild && firstChild.type === "tag")) &&
				firstChildName === "Image"
			) {
				const content = await getLayout("Image")(firstChild, context, options);
				const margin = addMargin(prevNode, name, firstChild);
				return margin ? [margin, content] : [content];
			}
		}
	}

	if (caseHandler) {
		const content = await caseHandler(node, context, options);
		const margin = addMargin(prevNode, name, node);
		return margin ? [margin, content] : [content];
	}

	return [];
}

export async function parseNodeToPDFContent(
	node: RenderableTreeNode | JSONContent,
	context: pdfRenderContext,
	options?: NodeOptions,
): Promise<Content[]> {
	const results: Content[] = [];

	if (typeof node !== "object" || (!isTag(node) && !("type" in node))) {
		return results;
	}

	if (!Array.isArray(node.children) && !("content" in node && Array.isArray(node.content))) {
		return results;
	}

	let prevNode: RenderableTreeNode | JSONContent = null;

	for (const currentNode of "children" in node ? node.children : node.content) {
		try {
			const content = await handleNode(currentNode, prevNode, context, options);
			results.push(...content);
			prevNode = currentNode;
		} catch (error) {
			results.push(await errorCase());
		}
	}

	return results;
}

export async function handleDocumentTree(
	node: DocumentTree,
	titlesMap: Map<string, TitleInfo>,
	catalog: ContextualCatalog<CatalogProps>,
	itemFilters: ItemFilter[],
): Promise<Content[]> {
	const results: Content[] = [];

	const context: pdfRenderContext = {
		titlesMap: titlesMap,
		parserContext: node.parserContext,
		articleName: node.name,
		order: node.number,
		headingMap: new Map<string, number>(),
		catalog,
		itemFilters,
	};

	results.push(createHeader(context));

	if ("content" in node && node.content) {
		const contentResults = await parseNodeToPDFContent(node.content, context);
		results.push(...contentResults);
	}

	if (node.children && node.children.length > 0) {
		if (node.content) results.push({ text: "", pageBreak: "after" });

		for (let i = 0; i < node.children.length; i++) {
			const child = node.children[i];
			const childResults = await handleDocumentTree(child, titlesMap, catalog, itemFilters);
			results.push(...childResults);

			if (i < node.children.length - 1) {
				results.push({ text: "", pageBreak: "after" });
			}
		}
	}

	return results;
}

const createHeader = (context: pdfRenderContext): Content => {
	const margins = HEADING_MARGINS["H1"];
	const bookmarkName = generateBookmarkName(context.order, context.articleName);
	context.headingMap.set(bookmarkName, 1);
	return {
		text: context.articleName,
		style: "H1",
		margin: [0, 0, 0, margins.bottom],
		id: bookmarkName,
	};
};
