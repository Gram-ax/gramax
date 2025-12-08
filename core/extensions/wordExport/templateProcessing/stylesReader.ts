import assert from "assert";
import jszip from "@dynamicImports/jszip";
import { parseXml } from "./xmlUtils";
import { ListLevelIndent, TemplateStylesInfo } from "./types";

export async function readTemplateStyles(templateBuffer: Buffer): Promise<TemplateStylesInfo> {
	const JSZip = await jszip();
	const templateZip = new JSZip();
	await templateZip.loadAsync(new Uint8Array(templateBuffer));

	const templateStylesXmlFile = templateZip.file("word/styles.xml");
	assert.ok(templateStylesXmlFile, "styles.xml not found in template.");

	const stylesContent = await templateStylesXmlFile.async("text");
	return extractStylesData(stylesContent);
}

export function extractStylesData(stylesContent: string): TemplateStylesInfo {
	const doc = parseXml(stylesContent);
	const mapping = new Map<string, string>();
	const paragraphIndents = new Map<string, ListLevelIndent>();

	const styles = Array.from(doc.getElementsByTagName("w:style"));
	for (const node of styles as any[]) {
		const type = node.getAttribute("w:type");
		if (type !== "paragraph" && type !== "character") continue;

		const styleId = node.getAttribute("w:styleId");
		const nameEl = node.getElementsByTagName("w:name")[0];
		const styleName = nameEl?.getAttribute("w:val");

		if (styleId && styleName) {
			mapping.set(styleName, styleId);
		}

		if (type === "paragraph" && styleId) {
			const indent = readIndentFromStyle(node as Element);
			if (indent) paragraphIndents.set(styleId, indent);
		}
	}

	return { mapping, paragraphIndents };
}

export function normalizeStyleMapping(mapping: Map<string, string>): Map<string, string> {
	const normalized = new Map<string, string>();
	for (const [name, id] of mapping.entries()) {
		normalized.set(name.toLowerCase().replace(/\s+/g, ""), id);
	}

	if (normalized.has("heading1")) normalized.set("title", normalized.get("heading1"));

	return normalized;
}

function readIndentFromStyle(styleNode: Element): ListLevelIndent | null {
	const pPr = styleNode.getElementsByTagName("w:pPr")[0];
	if (!pPr) return null;
	const indNode = pPr.getElementsByTagName("w:ind")[0];
	if (!indNode) return null;

	const indent: ListLevelIndent = {
		left: indNode.getAttribute("w:left"),
		hanging: indNode.getAttribute("w:hanging"),
		firstLine: indNode.getAttribute("w:firstLine"),
	};

	if (!indent.left && !indent.hanging && !indent.firstLine) return null;
	return indent;
}
