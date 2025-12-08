import TemplateProcessor from "../TemplateProcessor";
import * as JSZip from "jszip";
import { DOMParser } from "@xmldom/xmldom";
import { initModules } from "@app/resolveModule/backend";

const createZip = (files: Record<string, string>) => {
	const zip = new JSZip.default();
	for (const [path, content] of Object.entries(files)) {
		zip.file(path, content);
	}
	return zip;
};

const numberingWithStyleLink = `
<w:numbering xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:abstractNum w:abstractNumId="1">
    <w:styleLink w:val="ListParagraph"/>
    <w:lvl w:ilvl="0">
      <w:pPr>
        <w:tabs><w:tab w:val="num" w:pos="720"/></w:tabs>
        <w:ind w:left="720" w:hanging="360"/>
      </w:pPr>
    </w:lvl>
  </w:abstractNum>
  <w:abstractNum w:abstractNumId="2">
    <w:styleLink w:val="OrderedList"/>
    <w:lvl w:ilvl="0">
      <w:pPr>
        <w:tabs><w:tab w:val="num" w:pos="720"/></w:tabs>
        <w:ind w:left="720" w:hanging="360"/>
      </w:pPr>
    </w:lvl>
  </w:abstractNum>
  <w:num w:numId="1"><w:abstractNumId w:val="1"/></w:num>
</w:numbering>
`.trim();

describe("TemplateProcessor private methods", () => {
	beforeAll(async () => {
		await initModules();
	});

	test("_fixNumIdInZip replaces placeholders and appends numbering", async () => {
		const documentXml = `
      <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
        <w:body>
          <w:p>
            <w:pPr>
              <w:numPr><w:ilvl w:val="0"/><w:numId w:val="{orderedList-0}"/></w:numPr>
            </w:pPr>
            <w:r><w:t>Item</w:t></w:r>
          </w:p>
        </w:body>
      </w:document>
    `;
		const zip = await createZip({
			"word/document.xml": documentXml,
			"word/numbering.xml": numberingWithStyleLink,
		});

		const processor = new TemplateProcessor(Buffer.from(""), []);
		await (processor as any)._fixNumIdInZip(zip);

		const updatedDoc = await zip.file("word/document.xml").async("text");
		expect(updatedDoc).not.toContain("{orderedList-0}");

		const updatedNumbering = await zip.file("word/numbering.xml").async("text");
		const doc = new DOMParser().parseFromString(updatedNumbering, "application/xml");
		const appendedNums = doc.getElementsByTagName("w:num");
		expect(appendedNums.length).toBeGreaterThan(1);
	});

	test("_cleanTablePropertiesInZip removes extraneous table props", async () => {
		const documentXml = `
      <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
        <w:body>
          <w:tbl>
            <w:tblPr>
              <w:tblStyle w:val="Custom"/>
              <w:tblInd w:w="200" w:type="dxa"/>
              <w:tblLook w:val="04A0"/>
              <w:tblCellSpacing w:w="50"/>
            </w:tblPr>
            <w:tr><w:tc><w:p/></w:tc></w:tr>
          </w:tbl>
        </w:body>
      </w:document>
    `;

		const zip = await createZip({ "word/document.xml": documentXml });
		const processor = new TemplateProcessor(Buffer.from(""), []);
		await (processor as any)._cleanTablePropertiesInZip(zip);

		const updatedDoc = await zip.file("word/document.xml").async("text");
		expect(updatedDoc).not.toContain("tblCellSpacing");
	});

	test("_updateDocumentPropertiesInZip writes document metadata", async () => {
		const coreXml = `
      <cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties"
                         xmlns:dc="http://purl.org/dc/elements/1.1/"
                         xmlns:dcterms="http://purl.org/dc/terms/"
                         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
        <dc:title></dc:title>
        <cp:lastModifiedBy></cp:lastModifiedBy>
      </cp:coreProperties>
    `;
		const zip = await createZip({ "docProps/core.xml": coreXml });
		const processor = new TemplateProcessor(Buffer.from(""), [], { title: "Demo", lastModifiedBy: "Tester" });
		await (processor as any)._updateDocumentPropertiesInZip(zip);

	const updatedCore = await zip.file("docProps/core.xml").async("text");
	expect(updatedCore).toContain("Demo");
	expect(updatedCore).toContain("Tester");
	expect(updatedCore).toContain("dcterms:created");
});

describe("TemplateProcessor helper methods", () => {
	let processor: TemplateProcessor;

	beforeAll(async () => {
		await initModules();
		processor = new TemplateProcessor(Buffer.from(""), []);
	});

	test("_collectTemplateAbstractNums picks style-linked definitions", () => {
		const xml = `
      <w:numbering xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
        <w:abstractNum w:abstractNumId="1">
          <w:styleLink w:val="ListParagraph"/>
        </w:abstractNum>
        <w:abstractNum w:abstractNumId="2">
          <w:numStyleLink w:val="BulletList"/>
        </w:abstractNum>
      </w:numbering>
    `;
		const map = (processor as any)._collectTemplateAbstractNums(xml);
		expect(map.get("ListParagraph")).toContain("abstractNumId=\"1\"");
		expect(map.get("BulletList")).toContain("abstractNumId=\"2\"");
	});

	test("_getMaxIdFromXml finds highest id", () => {
		const xml = `<w:num w:numId="4"/><w:num w:numId="7"/>`;
		const max = (processor as any)._getMaxIdFromXml(xml, /w:numId="(\d+)"/g);
		expect(max).toBe(7);
	});

	test("_extractPlaceholders finds placeholder numbering ids", () => {
		const xml = `
      <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
        <w:p><w:pPr><w:numPr><w:numId w:val="{orderedList-0}"/></w:numPr></w:pPr></w:p>
        <w:p><w:pPr><w:numPr><w:numId w:val="5"/></w:numPr></w:pPr></w:p>
      </w:document>
    `;
		const placeholders = (processor as any)._extractPlaceholders(xml);
		expect(placeholders.has("{orderedList-0}")).toBe(true);
		expect(placeholders.size).toBe(1);
	});

	test("_generateNumberingEntries produces replacements", () => {
		const placeholders = new Set(["{orderedList-0}"]);
		const templateMap = new Map([
			["ListParagraph", "<w:abstractNum w:abstractNumId=\"1\"></w:abstractNum>"],
			["OrderedList", "<w:abstractNum w:abstractNumId=\"2\"></w:abstractNum>"],
		]);
		const result = (processor as any)._generateNumberingEntries({
			placeholders,
			templateAbstractNums: templateMap,
			startAbstractId: 10,
			startNumId: 20,
		});
		expect(result.placeholderToNewId.get("{orderedList-0}")).toBe("20");
		expect(result.newAbstractNumElements).toContain("abstractNumId=\"10\"");
		expect(result.newNumElements).toContain("numId=\"20\"");
	});

	test("_replacePlaceholdersInDocXml swaps numbering ids", () => {
		const doc = `<w:numId w:val="{orderedList-0}"/>`;
		const replaced = (processor as any)._replacePlaceholdersInDocXml(
			doc,
			new Map([["{orderedList-0}", "42"]]),
		);
		expect(replaced).toContain(`w:val="42"`);
	});

	test("_appendNumberingElements injects abstract/num parts", () => {
		const xml = `<w:numbering xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:num w:numId="1"/></w:numbering>`;
		const appended = (processor as any)._appendNumberingElements(xml, "<w:abstractNum w:abstractNumId=\"9\"/>", "<w:num w:numId=\"9\"/>");
		expect(appended).toContain("abstractNumId=\"9\"");
		expect(appended).toContain("numId=\"9\"");
	});

	test("_updateSettingsXmlInZip ensures updateFields flag", async () => {
		const zip = createZip({
			"word/settings.xml": `<w:settings xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"></w:settings>`,
		});
		await (processor as any)._updateSettingsXmlInZip(zip);
		const updated = await zip.file("word/settings.xml").async("text");
		expect(updated).toContain("w:updateFields");
	});

	test("_updateContentTypesXmlInZip rewrites document content type", async () => {
		const xml = `
      <Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
        <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.template.main+xml"/>
      </Types>
    `;
		const zip = createZip({ "[Content_Types].xml": xml });
		await (processor as any)._updateContentTypesXmlInZip(zip);
		const updated = await zip.file("[Content_Types].xml").async("text");
		expect(updated).toContain("document.main+xml");
	});
});
});
