import t from "@ext/localization/locale/translate";
import { ISectionOptions, patchDocument, PatchType, Paragraph, PageBreak } from "docx";
import JSZip from "jszip";
import assert from "assert";
import { DOMParser, XMLSerializer, Document, Element } from "@xmldom/xmldom";
import DefaultError from "@ext/errorHandlers/logic/DefaultError";

const CONTENT_PLACEHOLDER = "gramax_content";

const parseXml = (xml: string) => new DOMParser().parseFromString(xml, "application/xml");
const printXml = (node) => new XMLSerializer().serializeToString(node);

function setNsAttr(node: Element, name: string, value: string): void {
	node.setAttribute(name, value);
}

function getOrCreate(parent: any, tag: string, namespaceURI?: string): any {
	const existing = parent.getElementsByTagName?.(tag)?.[0];
	if (existing) return existing;
	const doc = parent.ownerDocument ?? parent;
	const el = namespaceURI ? doc.createElementNS(namespaceURI, tag) : doc.createElement(tag);
	parent.appendChild(el);
	return el;
}
class TemplateProcessor {
	private _templateBuffer: Buffer;
	private _docxSections: ISectionOptions[];
	private _documentProps: Record<string, string | number>;

	constructor(
		templateBuffer: Buffer,
		docxSections: ISectionOptions[],
		documentProps?: Record<string, string | number>,
	) {
		this._templateBuffer = templateBuffer;
		this._docxSections = docxSections;
		this._documentProps = documentProps;
	}

	async merge(): Promise<Buffer> {
		try {
			const patchedTemplate = await this._patchTemplate(this._templateBuffer);
			return patchedTemplate;
		} catch (error) {
			throw new DefaultError(
				t("app.error.command-failed.body"),
				error,
				{ showCause: true, html: true },
				false,
				t("word.template.error.processing-error"),
			);
		}
	}

	private async _patchTemplate(templateBuffer: Buffer): Promise<Buffer> {
		const children = this._docxSections.flatMap((section, index) => {
			const sectionChildren = [...(section.children || [])];
			const isLastSection = index === this._docxSections.length - 1;

			if (!isLastSection) {
				sectionChildren.push(
					new Paragraph({
						children: [new PageBreak()],
					}),
				);
			}
			return sectionChildren.filter((child) => child !== undefined);
		});

		const patchedDocument = await patchDocument(templateBuffer, {
			patches: {
				[CONTENT_PLACEHOLDER]: {
					type: PatchType.DOCUMENT,
					children: children,
				},
			},
		});

		const finalDocument = await this._processDocumentInSingleZip(patchedDocument);
		return Buffer.from(finalDocument);
	}

	private async _processDocumentInSingleZip(documentBuffer: Uint8Array): Promise<Uint8Array> {
		const templateStyleMapping = await this._readTemplateStyles();

		const zip = await JSZip.loadAsync(documentBuffer);

		await this._fixNumIdInZip(zip);
		await this._updateDocumentPropertiesInZip(zip);
		await this._fixStyleReferencesInZip(zip, templateStyleMapping);
		await this._cleanTablePropertiesInZip(zip);
		await this._updateSettingsXmlInZip(zip);
		await this._updateContentTypesXmlInZip(zip);

		return zip.generateAsync({ type: "uint8array" });
	}

	private async _readTemplateStyles(): Promise<Map<string, string>> {
		const templateZip = new JSZip();
		await templateZip.loadAsync(new Uint8Array(this._templateBuffer));

		const templateStylesXmlFile = templateZip.file("word/styles.xml");
		assert.ok(templateStylesXmlFile, "styles.xml not found in template.");

		const stylesContent = await templateStylesXmlFile.async("text");
		return this._extractStylesMapping(stylesContent);
	}

	private _extractStylesMapping(stylesContent: string): Map<string, string> {
		const doc = parseXml(stylesContent);
		const mapping = new Map<string, string>();

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
		}

		return mapping;
	}

	private async _fixNumIdInZip(zip: JSZip): Promise<void> {
		const docFile = zip.file("word/document.xml");
		const numFile = zip.file("word/numbering.xml");

		assert.ok(docFile, "document.xml not found.");
		assert.ok(numFile, "numbering.xml not found.");

		let docXml = await docFile.async("text");
		let numXml = await numFile.async("text");

		const templateAbstractNums = this._collectTemplateAbstractNums(numXml);
		assert.ok(
			templateAbstractNums.size > 0,
			"No template abstractNum definitions found. Cannot create new lists if needed.",
		);

		const maxAbstractId = this._getMaxIdFromXml(numXml, /w:abstractNumId="(\d+)"/g);
		const maxNumId = this._getMaxIdFromXml(numXml, /<w:num w:numId="(\d+)"/g);

		const placeholders = this._extractPlaceholders(docXml);
		if (placeholders.size === 0) return;

		const { placeholderToNewId, newAbstractNumElements, newNumElements } = this._generateNumberingEntries({
			placeholders,
			templateAbstractNums,
			startAbstractId: maxAbstractId + 1,
			startNumId: maxNumId + 1,
		});

		docXml = this._replacePlaceholdersInDocXml(docXml, placeholderToNewId);

		numXml = this._appendNumberingElements(numXml, newAbstractNumElements, newNumElements);

		zip.file("word/document.xml", docXml);
		zip.file("word/numbering.xml", numXml);
	}

	private _collectTemplateAbstractNums(numXml: string): Map<string, string> {
		const map = new Map<string, string>();
		const doc = parseXml(numXml);
		const serializer = new XMLSerializer();
		const abstractNums = Array.from(doc.getElementsByTagName("w:abstractNum"));
		for (const abs of abstractNums as any[]) {
			const styleLink =
				abs.getElementsByTagName("w:styleLink")[0] ?? abs.getElementsByTagName("w:numStyleLink")[0];
			if (styleLink) {
				const val = styleLink.getAttribute("w:val");
				if (val) {
					map.set(val, serializer.serializeToString(abs));
				}
			}
		}
		return map;
	}

	private _getMaxIdFromXml(xml: string, regex: RegExp): number {
		let maxId = 0;
		for (const match of xml.matchAll(regex)) {
			const id = parseInt(match[1], 10);
			if (!Number.isNaN(id)) {
				maxId = Math.max(maxId, id);
			}
		}
		return maxId;
	}

	private _extractPlaceholders(docXml: string): Set<string> {
		const placeholders = new Set<string>();
		const doc = parseXml(docXml);
		const numIdNodes = Array.from(doc.getElementsByTagName("w:numId"));
		for (const node of numIdNodes as any[]) {
			const val = node.getAttribute("w:val");
			if (val && /\{(?:bulletList|orderedList|taskList)-\d+\}/.test(val)) {
				placeholders.add(val);
			}
		}
		return placeholders;
	}

	private _generateNumberingEntries(params: {
		placeholders: Set<string>;
		templateAbstractNums: Map<string, string>;
		startAbstractId: number;
		startNumId: number;
	}): {
		placeholderToNewId: Map<string, string>;
		newAbstractNumElements: string;
		newNumElements: string;
	} {
		const { placeholders, templateAbstractNums, startAbstractId, startNumId } = params;

		const typeToStyleLink: Record<string, string> = {
			orderedList: "OrderedList",
			bulletList: "BulletList",
			taskList: "TaskList",
		};

		const placeholderToNewId = new Map<string, string>();
		let newAbstractNumElements = "";
		let newNumElements = "";
		let currentAbstractId = startAbstractId;
		let currentNumId = startNumId;

		for (const placeholder of placeholders) {
			const typeMatch = placeholder.match(/\{(bulletList|orderedList|taskList)-/);
			if (!typeMatch) continue;

			const listType = typeMatch[1];
			const styleName = typeToStyleLink[listType];
			const templateXml = templateAbstractNums.get(styleName);

			assert.ok(
				templateXml,
				`Template abstractNum not found for style '${styleName}'. Placeholder '${placeholder}'.`,
			);

			const newNsid = `<w:nsid w:val="${Math.random().toString(16).substring(2, 10).toUpperCase()}"/>`;

			let newAbstractXml = templateXml.replace(/w:abstractNumId="\d+"/, `w:abstractNumId="${currentAbstractId}"`);
			if (newAbstractXml.includes("<w:nsid")) {
				newAbstractXml = newAbstractXml.replace(/<w:nsid[^>]*\/>/, newNsid);
			} else {
				newAbstractXml = newAbstractXml.replace(/(<w:multiLevelType[^>]*\/>)/, `$1${newNsid}`);
			}

			const newNumXml = `<w:num w:numId="${currentNumId}"><w:abstractNumId w:val="${currentAbstractId}"/></w:num>`;

			newAbstractNumElements += newAbstractXml;
			newNumElements += newNumXml;
			placeholderToNewId.set(placeholder, String(currentNumId));

			currentAbstractId += 1;
			currentNumId += 1;
		}

		return { placeholderToNewId, newAbstractNumElements, newNumElements };
	}

	private _replacePlaceholdersInDocXml(docXml: string, placeholderToNewId: Map<string, string>): string {
		for (const [placeholder, newId] of placeholderToNewId.entries()) {
			const escaped = placeholder.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
			const regex = new RegExp(`(<w:numId w:val=")${escaped}("/>)`, "g");
			docXml = docXml.replace(regex, `$1${newId}$2`);
		}
		return docXml;
	}

	private _appendNumberingElements(numXml: string, abstractPart: string, numPart: string): string {
		if (!abstractPart && !numPart) return numXml;

		const NUMBERING_END = "</w:numbering>";
		const firstNumMatch = numXml.match(/<w:num\b[^>]*>/);

		let xmlWithAbstract = numXml;
		if (abstractPart) {
			if (firstNumMatch && firstNumMatch.index !== undefined) {
				const idx = firstNumMatch.index;
				xmlWithAbstract = numXml.slice(0, idx) + abstractPart + numXml.slice(idx);
			} else {
				const endIdx = numXml.lastIndexOf(NUMBERING_END);
				assert.ok(endIdx !== -1, "</w:numbering> tag not found. Failed to update numbering.xml.");
				xmlWithAbstract = numXml.slice(0, endIdx) + abstractPart + numXml.slice(endIdx);
			}
		}

		if (numPart) {
			const endIdx = xmlWithAbstract.lastIndexOf(NUMBERING_END);
			assert.ok(endIdx !== -1, "</w:numbering> tag not found. Failed to update numbering.xml.");
			xmlWithAbstract = xmlWithAbstract.slice(0, endIdx) + numPart + xmlWithAbstract.slice(endIdx);
		}

		return xmlWithAbstract;
	}

	private async _updateDocumentPropertiesInZip(zip: JSZip): Promise<void> {
		const file = zip.file("docProps/core.xml");
		if (!file) return;

		const xmlText = await file.async("text");
		const doc = parseXml(xmlText);

		const coreProps = doc.documentElement;

		const mapping: Record<string, string> = {
			title: "dc:title",
			creator: "dc:creator",
			description: "dc:description",
			subject: "dc:subject",
			keywords: "cp:keywords",
			lastModifiedBy: "cp:lastModifiedBy",
			revision: "cp:revision",
		};

		if (this._documentProps) {
			for (const [key, val] of Object.entries(this._documentProps)) {
				const tagName = mapping[key];
				if (!tagName) continue;
				const el = getOrCreate(coreProps, tagName);
				el.textContent = String(val);
			}
		}

		const nowIso = new Date().toISOString();
		for (const name of ["dcterms:created", "dcterms:modified"]) {
			const el = getOrCreate(coreProps, name);
			setNsAttr(el, "xsi:type", "dcterms:W3CDTF");
			el.textContent = nowIso;
		}

		zip.file("docProps/core.xml", printXml(doc));
	}

	private async _fixStyleReferencesInZip(zip: JSZip, templateStyleMapping: Map<string, string>): Promise<void> {
		const map = this._normalizeStyleMapping(templateStyleMapping);

		const docFile = zip.file("word/document.xml");
		assert.ok(docFile, "document.xml not found for style fixing.");
		const xmlText = await docFile.async("text");

		const doc = parseXml(xmlText);

		const processTag = (tagName: string) => {
			const nodes = Array.from(doc.getElementsByTagName(tagName));
			for (const node of nodes as any[]) {
				const valAttr = node.getAttribute("w:val");
				if (!valAttr) continue;
				const key = valAttr.toLowerCase().replace(/\s+/g, "");
				if (map.has(key)) {
					node.setAttribute("w:val", map.get(key));
				}
			}
		};

		processTag("w:pStyle");
		processTag("w:rStyle");

		zip.file("word/document.xml", printXml(doc));
	}

	private _normalizeStyleMapping(mapping: Map<string, string>): Map<string, string> {
		const normalized = new Map<string, string>();
		for (const [name, id] of mapping.entries()) {
			normalized.set(name.toLowerCase().replace(/\s+/g, ""), id);
		}

		if (normalized.has("heading1")) normalized.set("title", normalized.get("heading1"));

		return normalized;
	}

	private async _cleanTablePropertiesInZip(zip: JSZip): Promise<void> {
		const docPath = "word/document.xml";
		const docFile = zip.file(docPath);
		const xmlString = await docFile.async("text");
		const xmlDoc = parseXml(xmlString);

		const tables = Array.from(xmlDoc.getElementsByTagName("w:tbl"));

		for (let i = 0; i < tables.length; i++) {
			const table = tables[i];
			this._cleanTblPr(xmlDoc, table);
			this._removeTrPr(table);
			this._cleanTcPr(xmlDoc, table);
		}

		zip.file(docPath, printXml(xmlDoc));
	}

	private _cleanTblPr(xmlDoc: Document, table: Element): void {
		const tblPr = table.getElementsByTagName("w:tblPr")[0];
		if (!tblPr) return;

		const parent = tblPr.parentNode;
		const newTblPr = xmlDoc.createElement("w:tblPr");

		const tblStyle = tblPr.getElementsByTagName("w:tblStyle")[0];
		if (tblStyle) newTblPr.appendChild(tblStyle.cloneNode(true));

		const tblInd = tblPr.getElementsByTagName("w:tblInd")[0];
		if (tblInd) newTblPr.appendChild(tblInd.cloneNode(true));

		if (parent) {
			parent.insertBefore(newTblPr, tblPr);
			parent.removeChild(tblPr);
		}
	}

	private _removeTrPr(table: Element): void {
		const rows = Array.from(table.getElementsByTagName("w:tr"));
		for (const row of rows) {
			const trPr = row.getElementsByTagName("w:trPr")[0];
			if (trPr) row.removeChild(trPr);
		}
	}

	private _cleanTcPr(xmlDoc: Document, table: Element): void {
		const cells = Array.from(table.getElementsByTagName("w:tc"));
		for (const cell of cells) {
			const tcPr = cell.getElementsByTagName("w:tcPr")[0];
			if (!tcPr) continue;

			const parent = tcPr.parentNode;
			const newTcPr = xmlDoc.createElement("w:tcPr");

			const tcW = tcPr.getElementsByTagName("w:tcW")[0];
			if (tcW) newTcPr.appendChild(tcW.cloneNode(true));

			if (parent) {
				parent.insertBefore(newTcPr, tcPr);
				parent.removeChild(tcPr);
			}
		}
	}

	private async _updateSettingsXmlInZip(zip: JSZip): Promise<void> {
		const file = zip.file("word/settings.xml");
		if (!file) return;

		const xmlText = await file.async("text");
		const doc = parseXml(xmlText);

		const settingsEl = doc.documentElement;
		const existing = settingsEl.getElementsByTagName("w:updateFields")[0];
		if (existing) {
			existing.setAttribute("w:val", "true");
		} else {
			const newEl = doc.createElement("w:updateFields");
			newEl.setAttribute("w:val", "true");
			settingsEl.appendChild(newEl);
		}

		zip.file("word/settings.xml", printXml(doc));
	}

	private async _updateContentTypesXmlInZip(zip: JSZip): Promise<void> {
		const file = zip.file("[Content_Types].xml");
		assert.ok(file, "[Content_Types].xml not found.");

		const xmlText = await file.async("text");
		const doc = parseXml(xmlText);

		const typesEl = doc.documentElement;

		const DOC_TYPE = "application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml";
		const TEMPLATE_TYPE = "application/vnd.openxmlformats-officedocument.wordprocessingml.template.main+xml";

		let overrideEl: any = null;
		const overrides = Array.from(typesEl.getElementsByTagName("Override"));
		for (const el of overrides as any[]) {
			if (el.getAttribute("PartName") === "/word/document.xml") {
				overrideEl = el;
				break;
			}
		}

		if (overrideEl) {
			overrideEl.setAttribute("ContentType", DOC_TYPE);
		} else {
			const newOverride = doc.createElement("Override");
			newOverride.setAttribute("PartName", "/word/document.xml");
			newOverride.setAttribute("ContentType", DOC_TYPE);
			typesEl.appendChild(newOverride);
		}

		overrides.forEach((el: any) => {
			if (el.getAttribute("ContentType") === TEMPLATE_TYPE) {
				el.setAttribute("ContentType", DOC_TYPE);
			}
		});

		zip.file("[Content_Types].xml", printXml(doc));
	}
}

export default TemplateProcessor;
