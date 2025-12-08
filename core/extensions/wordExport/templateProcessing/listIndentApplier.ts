import { WordFontStyles } from "@ext/wordExport/options/wordExportSettings";
import { parseListContinuationBookmark, parseListContinuationCaption } from "@ext/wordExport/utils/listContinuation";
import { ListLevelIndent, TemplateStylesInfo } from "./types";

export type ListLevelFormat = {
	indent?: ListLevelIndent;
};

type ListTraversalState = {
	levelContext: Array<{ numId: string; level: number } | undefined>;
	tableContextDepth: number;
	continuationBookmarks: Map<string, number | undefined>;
	continuationBookmarkOrder: string[];
};

type ListTraversalConfig = {
	state: ListTraversalState;
	indentMap: Map<string, Map<number, ListLevelFormat>>;
	listParagraphStyleId: string;
	listParagraphStyleIndent?: ListLevelIndent;
	continuationStyleIds: Set<string>;
};

export function applyTemplateListIndents(
	doc: Document,
	numberingDoc: Document,
	templateStyles: TemplateStylesInfo,
	normalizedStyles: Map<string, string>,
): void {
	const listParagraphStyleId = normalizedStyles.get("listparagraph") ?? WordFontStyles.listParagraph;
	const listParagraphStyleIndent = templateStyles.paragraphIndents.get(listParagraphStyleId);
	const continuationStyleIds = new Set<string>([listParagraphStyleId]);
	const pictureTitleStyleId = normalizedStyles.get("picturetitle") ?? WordFontStyles.pictureTitle;
	if (pictureTitleStyleId) continuationStyleIds.add(pictureTitleStyleId);
	const indentMap = buildNumberingIndentMap(numberingDoc);
	if (indentMap.size === 0) return;

	const body = doc.getElementsByTagName("w:body")[0];
	if (!body) return;

	const traversalState: ListTraversalState = {
		levelContext: [],
		tableContextDepth: 0,
		continuationBookmarks: new Map(),
		continuationBookmarkOrder: [],
	};
	traverseListContent(body, {
		state: traversalState,
		indentMap,
		listParagraphStyleId,
		listParagraphStyleIndent,
		continuationStyleIds,
	});
}

function traverseListContent(element: Element, config: ListTraversalConfig): void {
	const children = Array.from(element.childNodes);
	for (const child of children) {
		if (child.nodeType !== 1) continue;
		const childElement = child as Element;
		const nodeName = childElement.nodeName;
		if (nodeName === "w:bookmarkStart" || nodeName === "w:bookmarkEnd") {
			updateContinuationBookmarkState(childElement, config.state);
			continue;
		}
		if (nodeName === "w:p") {
			processListParagraphNode(childElement, config);
		} else if (nodeName === "w:tbl") {
			const openedContext = processListTableNode(childElement, config);
			if (openedContext) config.state.tableContextDepth += 1;
			traverseListContent(childElement, config);
			if (openedContext) config.state.tableContextDepth = Math.max(config.state.tableContextDepth - 1, 0);
		} else {
			traverseListContent(childElement, config);
		}
	}
}

function processListParagraphNode(paragraph: Element, config: ListTraversalConfig): void {
	const { state, indentMap, listParagraphStyleId, listParagraphStyleIndent, continuationStyleIds } = config;
	openParagraphContinuationBookmarks(paragraph, state);

	try {
		const pPr = getParagraphProperties(paragraph, false);
		const styleValue = getParagraphStyleValue(pPr);
		const isListParagraph = styleValue === listParagraphStyleId;
		const explicitContinuationActive = state.continuationBookmarks.size > 0;
		const explicitContinuationLevel = explicitContinuationActive ? getActiveContinuationLevel(state) : undefined;
		const isContinuationStyle = styleValue ? continuationStyleIds.has(styleValue) : false;

		const numbering = getParagraphNumbering(pPr);
		if (numbering) {
			state.levelContext[numbering.level] = numbering;
			state.levelContext.length = numbering.level + 1;
		} else if (
			!isListParagraph &&
			!isContinuationStyle &&
			!explicitContinuationActive &&
			state.tableContextDepth === 0
		) {
			state.levelContext.length = 0;
		}

		const shouldApplyIndent = isListParagraph || isContinuationStyle || explicitContinuationActive;
		const existingIndent = shouldApplyIndent ? readIndentAttributes(pPr) : null;
		if (existingIndent) removeParagraphIndent(pPr);

		if (numbering) {
			if (isListParagraph) removeParagraphStyle(paragraph);
			return;
		}

		if (!shouldApplyIndent) return;

		const context = getListContextForLevel(state.levelContext, explicitContinuationLevel);
		const targetPPr = getParagraphProperties(paragraph, true);
		if (!targetPPr) return;

		if (!context) {
			const fallbackIndent = mergeIndents(existingIndent, listParagraphStyleIndent);
			if (fallbackIndent) applyIndent(targetPPr, fallbackIndent);
			if (isListParagraph) removeParagraphStyle(paragraph);
			return;
		}

		const format = indentMap.get(context.numId)?.get(context.level);
		const resolvedIndent = resolveListContentIndent({
			format,
			styleIndent: listParagraphStyleIndent,
			existingIndent,
		});

		if (resolvedIndent) applyIndent(targetPPr, resolvedIndent);
		if (isListParagraph) removeParagraphStyle(paragraph);
	} finally {
		closeParagraphContinuationBookmarks(paragraph, state);
	}
}

function processListTableNode(table: Element, config: ListTraversalConfig): boolean {
	const { state, indentMap, listParagraphStyleIndent, listParagraphStyleId } = config;
	const continuationMeta = getTableContinuationMetadata(table);
	if (!continuationMeta.matches) {
		state.levelContext.length = 0;
		return false;
	}

	const context = getListContextForLevel(state.levelContext, continuationMeta.level);
	const format = context ? indentMap.get(context.numId)?.get(context.level) : undefined;
	const resolvedIndent = resolveListContentIndent({
		format,
		styleIndent: listParagraphStyleIndent,
	});

	applyIndentToTable(table, resolvedIndent?.left);
	stripListParagraphFormatting(table, listParagraphStyleId);
	return true;
}

function getTableContinuationMetadata(table: Element) {
	const captionVal = table.getElementsByTagName("w:tblCaption")[0]?.getAttribute("w:val");
	return parseListContinuationCaption(captionVal);
}

function openParagraphContinuationBookmarks(paragraph: Element, state: ListTraversalState): void {
	const markers = collectContinuationBookmarkStartMarkers(paragraph);
	for (const marker of markers) {
		registerContinuationBookmark(state, marker.id, marker.level);
	}
}

function closeParagraphContinuationBookmarks(paragraph: Element, state: ListTraversalState): void {
	const ids = collectContinuationBookmarkEndIds(paragraph);
	for (const id of ids) {
		unregisterContinuationBookmark(state, id);
	}
}

function updateContinuationBookmarkState(node: Element, state: ListTraversalState): void {
	if (node.nodeName === "w:bookmarkStart") {
		const marker = getContinuationBookmarkStartMarker(node);
		if (marker) registerContinuationBookmark(state, marker.id, marker.level);
		return;
	}

	if (node.nodeName === "w:bookmarkEnd") {
		const id = node.getAttribute("w:id");
		if (id) unregisterContinuationBookmark(state, id);
	}
}

type ContinuationBookmarkMarker = { id: string; level?: number };

function collectContinuationBookmarkStartMarkers(parent: Element): ContinuationBookmarkMarker[] {
	const starts = Array.from(parent.getElementsByTagName("w:bookmarkStart"));
	const result: ContinuationBookmarkMarker[] = [];
	for (const start of starts) {
		const marker = getContinuationBookmarkStartMarker(start);
		if (marker) result.push(marker);
	}
	return result;
}

function collectContinuationBookmarkEndIds(parent: Element): string[] {
	const ends = Array.from(parent.getElementsByTagName("w:bookmarkEnd"));
	const result: string[] = [];
	for (const end of ends) {
		const id = end.getAttribute("w:id");
		if (id) result.push(id);
	}
	return result;
}

function getContinuationBookmarkStartMarker(node: Element): ContinuationBookmarkMarker | null {
	const name = node.getAttribute("w:name");
	const parsed = parseListContinuationBookmark(name);
	if (!parsed.matches) return null;
	const id = node.getAttribute("w:id");
	if (!id) return null;
	return { id, level: parsed.level };
}

function registerContinuationBookmark(state: ListTraversalState, id: string, level?: number): void {
	if (!id) return;
	const alreadyTracked = state.continuationBookmarks.has(id);
	state.continuationBookmarks.set(id, level);
	if (!alreadyTracked) {
		state.continuationBookmarkOrder.push(id);
	}
}

function unregisterContinuationBookmark(state: ListTraversalState, id: string): void {
	if (!id) return;
	if (!state.continuationBookmarks.has(id)) return;
	state.continuationBookmarks.delete(id);
	for (let i = state.continuationBookmarkOrder.length - 1; i >= 0; i--) {
		if (state.continuationBookmarkOrder[i] === id) {
			state.continuationBookmarkOrder.splice(i, 1);
			break;
		}
	}
}

function getActiveContinuationLevel(state: ListTraversalState): number | undefined {
	for (let i = state.continuationBookmarkOrder.length - 1; i >= 0; i--) {
		const id = state.continuationBookmarkOrder[i];
		if (!state.continuationBookmarks.has(id)) continue;
		return state.continuationBookmarks.get(id);
	}
	return undefined;
}

function buildNumberingIndentMap(numDoc: Document): Map<string, Map<number, ListLevelFormat>> {
	type AbstractMeta = { formats: Map<number, ListLevelFormat>; styleName?: string | null };
	const abstractMetaMap = new Map<string, AbstractMeta>();
	const styleFormatMap = new Map<string, Map<number, ListLevelFormat>>();

	const abstractNums = Array.from(numDoc.getElementsByTagName("w:abstractNum"));
	for (const abstract of abstractNums) {
		const id = abstract.getAttribute("w:abstractNumId");
		if (!id) continue;

		const formats = collectLevelFormats(abstract);
		const styleName = extractStyleLink(abstract);
		abstractMetaMap.set(id, { formats, styleName });

		if (styleName && formats.size > 0 && !styleFormatMap.has(styleName)) {
			styleFormatMap.set(styleName, cloneFormatMap(formats));
		}
	}

	for (const meta of abstractMetaMap.values()) {
		if (meta.formats.size === 0 && meta.styleName) {
			const styleFormats = styleFormatMap.get(meta.styleName);
			if (styleFormats) {
				meta.formats = cloneFormatMap(styleFormats);
			}
		}
	}

	const result = new Map<string, Map<number, ListLevelFormat>>();
	const nums = Array.from(numDoc.getElementsByTagName("w:num"));
	for (const num of nums) {
		const numId = num.getAttribute("w:numId");
		const abstractId = num.getElementsByTagName("w:abstractNumId")[0]?.getAttribute("w:val");
		if (!numId || !abstractId) continue;

		const combined = new Map<number, ListLevelFormat>();
		const baseLevels = abstractMetaMap.get(abstractId)?.formats;
		if (baseLevels) {
			for (const [level, format] of baseLevels.entries()) {
				combined.set(level, cloneFormat(format));
			}
		}

		const overrides = Array.from(num.getElementsByTagName("w:lvlOverride"));
		for (const override of overrides) {
			const levelAttr = override.getAttribute("w:ilvl");
			const level = levelAttr !== null ? parseInt(levelAttr, 10) : NaN;
			if (Number.isNaN(level)) continue;
			const lvlNode = override.getElementsByTagName("w:lvl")[0];
			if (!lvlNode) continue;
			const format = extractFormatFromLvl(lvlNode);
			if (format) combined.set(level, format);
		}

		result.set(numId, combined);
	}

	return result;
}

function collectLevelFormats(parent: Element): Map<number, ListLevelFormat> {
	const map = new Map<number, ListLevelFormat>();
	const levels = Array.from(parent.getElementsByTagName("w:lvl"));
	for (const lvl of levels) {
		const levelAttr = lvl.getAttribute("w:ilvl");
		const level = levelAttr !== null ? parseInt(levelAttr, 10) : NaN;
		if (Number.isNaN(level)) continue;
		const format = extractFormatFromLvl(lvl);
		if (format) map.set(level, format);
	}
	return map;
}

function extractFormatFromLvl(lvl: Element): ListLevelFormat | null {
	const indent = extractIndentFromLvl(lvl);
	if (!indent) return null;
	return { indent: { ...indent } };
}

function extractStyleLink(parent: Element): string | null {
	const styleLink = parent.getElementsByTagName("w:styleLink")[0]?.getAttribute("w:val");
	if (styleLink) return styleLink;
	const numStyleLink = parent.getElementsByTagName("w:numStyleLink")[0]?.getAttribute("w:val");
	return numStyleLink ?? null;
}

function cloneFormatMap(source: Map<number, ListLevelFormat>): Map<number, ListLevelFormat> {
	const clone = new Map<number, ListLevelFormat>();
	for (const [level, format] of source.entries()) {
		clone.set(level, cloneFormat(format));
	}
	return clone;
}

function cloneFormat(format: ListLevelFormat): ListLevelFormat {
	return {
		indent: format.indent ? { ...format.indent } : undefined,
	};
}

function extractIndentFromLvl(lvl: Element): ListLevelIndent | null {
	const pPr = findDirectChild(lvl, "w:pPr");
	const indNode = (pPr ? findDirectChild(pPr, "w:ind") : null) ?? findDirectChild(lvl, "w:ind");
	if (!indNode) return null;

	const indent: ListLevelIndent = {
		left: indNode.getAttribute("w:left"),
		hanging: indNode.getAttribute("w:hanging"),
		firstLine: indNode.getAttribute("w:firstLine"),
	};

	if (!indent.left && !indent.hanging && !indent.firstLine) return null;
	return indent;
}

function applyIndentToTable(table: Element, leftTwips?: string | null): void {
	if (!leftTwips) return;

	let tblPr = table.getElementsByTagName("w:tblPr")[0];

	if (!tblPr) {
		tblPr = table.ownerDocument.createElement("w:tblPr");
		table.insertBefore(tblPr, table.firstChild);
	}

	let tblInd = tblPr.getElementsByTagName("w:tblInd")[0];
	if (!tblInd) {
		tblInd = table.ownerDocument.createElement("w:tblInd");
		tblPr.appendChild(tblInd);
	}

	tblInd.setAttribute("w:w", leftTwips);
	tblInd.setAttribute("w:type", "dxa");
}

function stripListParagraphFormatting(container: Element, styleId: string): void {
	const paragraphs = Array.from(container.getElementsByTagName("w:p"));
	for (const paragraph of paragraphs) {
		const pPr = getParagraphProperties(paragraph, false);
		if (!pPr) continue;

		const styleValue = getParagraphStyleValue(pPr);
		if (styleValue === styleId) {
			const styleNode = findDirectChild(pPr, "w:pStyle");
			if (styleNode) pPr.removeChild(styleNode);
		}

		const hasNumbering = Boolean(getParagraphNumbering(pPr));
		if (!hasNumbering) {
			removeParagraphIndent(pPr);
		}
	}
}

function resolveListContentIndent(params: {
	format?: ListLevelFormat;
	styleIndent?: ListLevelIndent;
	existingIndent?: ListLevelIndent | null;
}): ListLevelIndent | null {
	const { format, styleIndent, existingIndent } = params;
	const baseLeft = calculateListTextLeft(format);
	if (baseLeft !== undefined) {
		return {
			left: String(baseLeft),
		};
	}
	const styleLeft = parseTwips(styleIndent?.left);
	if (styleLeft !== undefined) {
		return { left: String(styleLeft) };
	}

	return existingIndent ?? null;
}

function calculateListTextLeft(format?: ListLevelFormat): number | undefined {
	if (!format) return undefined;
	const indentLeft = parseTwips(format.indent?.left);
	return indentLeft;
}

function getParagraphProperties(paragraph: Element, createIfMissing: boolean): Element | null {
	let pPr = findDirectChild(paragraph, "w:pPr");
	if (!pPr && createIfMissing) {
		pPr = paragraph.ownerDocument.createElement("w:pPr");
		paragraph.insertBefore(pPr, paragraph.firstChild);
	}
	return pPr;
}

function getParagraphStyleValue(pPr: Element | null): string | null {
	const styleNode = pPr ? findDirectChild(pPr, "w:pStyle") : null;
	return styleNode?.getAttribute("w:val") ?? null;
}

function getParagraphNumbering(pPr: Element | null): { numId: string; level: number } | null {
	if (!pPr) return null;
	const numPr = findDirectChild(pPr, "w:numPr");
	if (!numPr) return null;
	const numId = findDirectChild(numPr, "w:numId")?.getAttribute("w:val");
	const levelAttr = findDirectChild(numPr, "w:ilvl")?.getAttribute("w:val");
	if (!numId || levelAttr === null || levelAttr === undefined) return null;
	const level = parseInt(levelAttr, 10);
	return { numId, level: Number.isNaN(level) ? 0 : level };
}

function readIndentAttributes(pPr: Element | null): ListLevelIndent | null {
	if (!pPr) return null;
	const indNode = findDirectChild(pPr, "w:ind");
	if (!indNode) return null;
	const indent: ListLevelIndent = {
		left: indNode.getAttribute("w:left"),
		hanging: indNode.getAttribute("w:hanging"),
		firstLine: indNode.getAttribute("w:firstLine"),
	};
	if (!indent.left && !indent.hanging && !indent.firstLine) return null;
	return indent;
}

function removeParagraphIndent(pPr: Element | null): void {
	if (!pPr) return;
	const indNode = findDirectChild(pPr, "w:ind");
	if (indNode) pPr.removeChild(indNode);
}

function applyIndent(pPr: Element, indent: ListLevelIndent): void {
	let indNode = findDirectChild(pPr, "w:ind");
	if (!indNode) {
		indNode = pPr.ownerDocument.createElement("w:ind");
		pPr.appendChild(indNode);
	}

	if (indent.left) indNode.setAttribute("w:left", indent.left);
	else indNode.removeAttribute("w:left");

	if (indent.hanging) indNode.setAttribute("w:hanging", indent.hanging);
	else indNode.removeAttribute("w:hanging");

	if (indent.firstLine) indNode.setAttribute("w:firstLine", indent.firstLine);
	else indNode.removeAttribute("w:firstLine");
}

function removeParagraphStyle(paragraph: Element): void {
	const pPr = getParagraphProperties(paragraph, false);
	if (!pPr) return;
	const styleNode = findDirectChild(pPr, "w:pStyle");
	if (styleNode) pPr.removeChild(styleNode);
}

function getActiveListContext(contexts: Array<{ numId: string; level: number } | undefined>) {
	for (let i = contexts.length - 1; i >= 0; i--) {
		const context = contexts[i];
		if (context) return context;
	}
	return null;
}

function getListContextForLevel(contexts: Array<{ numId: string; level: number } | undefined>, level?: number) {
	if (level === undefined || level === null) return getActiveListContext(contexts);
	if (level < 0 || level >= contexts.length) return null;
	return contexts[level] ?? null;
}

function mergeIndents(primary?: ListLevelIndent | null, secondary?: ListLevelIndent | null): ListLevelIndent | null {
	const left = sumIndentValues(primary?.left, secondary?.left);
	const hanging = sumIndentValues(primary?.hanging, secondary?.hanging);
	const firstLine = sumIndentValues(primary?.firstLine, secondary?.firstLine);
	if (left === undefined && hanging === undefined && firstLine === undefined) return null;
	return {
		...(left !== undefined ? { left } : {}),
		...(hanging !== undefined ? { hanging } : {}),
		...(firstLine !== undefined ? { firstLine } : {}),
	};
}

function sumIndentValues(...values: Array<string | null | undefined>): string | undefined {
	let total = 0;
	let hasValue = false;
	for (const value of values) {
		if (typeof value !== "string" || value.trim() === "") continue;
		const parsed = parseInt(value, 10);
		if (Number.isNaN(parsed)) continue;
		total += parsed;
		hasValue = true;
	}

	if (!hasValue) return undefined;
	return String(total);
}

function parseTwips(value?: string | null): number | undefined {
	if (typeof value !== "string" || value.trim() === "") return undefined;
	const parsed = parseInt(value, 10);
	return Number.isNaN(parsed) ? undefined : parsed;
}

function findDirectChild(parent: Element, tagName: string): Element | null {
	const children = Array.from(parent.childNodes);
	for (const child of children) {
		if (child.nodeType !== 1) continue;
		if ((child as Element).nodeName === tagName) return child as Element;
	}
	return null;
}
