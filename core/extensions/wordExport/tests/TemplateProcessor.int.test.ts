import TemplateProcessor from "../TemplateProcessor";
import * as JSZip from "jszip";
import { Paragraph } from "docx";
import { DOMParser } from "@xmldom/xmldom";

const createMockDocx = async (files: { [key: string]: string }): Promise<Uint8Array> => {
	const zip = new JSZip.default();
	for (const path in files) {
		zip.file(path, files[path]);
	}
	return zip.generateAsync({ type: "uint8array" });
};

describe("TemplateProcessor", () => {
	let consoleErrorSpy: jest.SpyInstance;
	let consoleWarnSpy: jest.SpyInstance;

	beforeEach(() => {
		consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
		consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
	});

	afterEach(() => {
		consoleErrorSpy.mockRestore();
		consoleWarnSpy.mockRestore();
	});

	describe("_escapeXml", () => {
		const processor = new TemplateProcessor(Buffer.from(""), []);
		const escapeXml = (processor as any)._escapeXml;

		it("should correctly escape special XML characters", () => {
			const input = `< > " ' &`;
			const expected = `&lt; &gt; &quot; &#39; &amp;`;
			expect(escapeXml(input)).toBe(expected);
		});

		it("should not change a string without special characters", () => {
			const input = "Simple text without special characters.";
			expect(escapeXml(input)).toBe(input);
		});
	});

	describe("_readTemplateStyles", () => {
		it("should correctly read and map styles from styles.xml", async () => {
			const stylesXml = `
        <w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
          <w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="heading 1"/></w:style>
          <w:style w:type="character" w:styleId="DefaultParagraphFont"><w:name w:val="Default Paragraph Font"/></w:style>
          <w:style w:type="paragraph" w:styleId="MyTitle"><w:name w:val="Title"/></w:style>
        </w:styles>
      `;
			const mockTemplate = await createMockDocx({ "word/styles.xml": stylesXml });
			const processor = new TemplateProcessor(Buffer.from(mockTemplate), []);
			const styleMap = await (processor as any)._readTemplateStyles();

			expect(styleMap.size).toBe(3);
			expect(styleMap.get("heading 1")).toBe("Heading1");
			expect(styleMap.get("Title")).toBe("MyTitle");
		});

		it("should throw an error if styles.xml is not found", async () => {
			const mockTemplate = await createMockDocx({ "other/file.txt": "data" });
			const processor = new TemplateProcessor(Buffer.from(mockTemplate), []);
			await expect((processor as any)._readTemplateStyles()).rejects.toThrow("styles.xml not found in template.");
		});
	});

	describe("_fixNumIdInZip", () => {
		it("should create new numbering definitions for placeholders", async () => {
			const documentXml = `
        <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
          <w:body>
            <w:p><w:pPr><w:numPr><w:numId w:val="{bulletList-0}"/></w:numPr></w:pPr></w:p>
            <w:p><w:pPr><w:numPr><w:numId w:val="{orderedList-1}"/></w:numPr></w:pPr></w:p>
            <w:p><w:pPr><w:numPr><w:numId w:val="{bulletList-0}"/></w:numPr></w:pPr></w:p>
          </w:body>
        </w:document>
      `;
			const numberingXml = `
        <w:numbering xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
          <w:abstractNum w:abstractNumId="5"><w:styleLink w:val="BulletList"/></w:abstractNum>
          <w:abstractNum w:abstractNumId="6"><w:styleLink w:val="OrderedList"/></w:abstractNum>
          <w:num w:numId="10"><w:abstractNumId w:val="100"/></w:num>
        </w:numbering>
      `;
			const mockDocx = await createMockDocx({
				"word/document.xml": documentXml,
				"word/numbering.xml": numberingXml,
			});
			const zip = (await JSZip.loadAsync(mockDocx)) as JSZip;
			const processor = new TemplateProcessor(Buffer.from(""), []);
			await (processor as any)._fixNumIdInZip(zip);

			const docFile = zip.file("word/document.xml");
			expect(docFile).not.toBeNull();
			const updatedDocXml = await docFile.async("text");

			const numFile = zip.file("word/numbering.xml");
			expect(numFile).not.toBeNull();
			const updatedNumXml = await numFile.async("text");

			expect(updatedDocXml).toContain('<w:numId w:val="11"/>');
			expect(updatedDocXml).toContain('<w:numId w:val="12"/>');
			const docDom = new DOMParser().parseFromString(updatedDocXml, "application/xml");
			const numIds = Array.from(docDom.getElementsByTagName("w:numId"));
			const count11 = numIds.filter((n: any) => n.getAttribute("w:val") === "11").length;
			expect(count11).toBe(2);

			const numDom = new DOMParser().parseFromString(updatedNumXml, "application/xml");
			const absIds = Array.from(numDom.getElementsByTagName("w:abstractNum")).map((n: any) =>
				n.getAttribute("w:abstractNumId"),
			);
			expect(absIds).toEqual(expect.arrayContaining(["7", "8"]));
			const numIdList = Array.from(numDom.getElementsByTagName("w:num")).map((n: any) =>
				n.getAttribute("w:numId"),
			);
			expect(numIdList).toEqual(expect.arrayContaining(["11", "12"]));
		});
	});

	describe("_updateDocumentPropertiesInZip", () => {
		const coreXml = `
      <cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
        <dc:title>Old Title</dc:title>
        <dc:creator>Old Author</dc:creator>
        <cp:revision>1</cp:revision>
        <dcterms:created xsi:type="dcterms:W3CDTF">2022-01-01T00:00:00Z</dcterms:created>
        <dcterms:modified xsi:type="dcterms:W3CDTF">2022-01-01T00:00:00Z</dcterms:modified>
      </cp:coreProperties>
    `;

		it("should update existing properties and add new ones", async () => {
			const docProps = {
				title: "New Title",
				creator: "New Author",
				subject: "New Subject",
				revision: 2,
			};

			const mockDocx = await createMockDocx({ "docProps/core.xml": coreXml });
			const zip = (await JSZip.loadAsync(mockDocx)) as JSZip;
			const processor = new TemplateProcessor(Buffer.from(""), [], docProps);
			await (processor as any)._updateDocumentPropertiesInZip(zip);

			const coreFile = zip.file("docProps/core.xml");
			expect(coreFile).not.toBeNull();
			const updatedXml = await coreFile.async("text");

			expect(updatedXml).toContain("<dc:title>New Title</dc:title>");
			expect(updatedXml).toContain("<dc:creator>New Author</dc:creator>");
			expect(updatedXml).toContain("<dc:subject>New Subject</dc:subject>");
			expect(updatedXml).toContain("<cp:revision>2</cp:revision>");
			expect(updatedXml).not.toContain("2022-01-01T00:00:00Z");
		});
	});

	describe("_fixStyleReferencesInZip", () => {
		const documentXml = `
      <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
        <w:body>
          <w:p><w:pPr><w:pStyle w:val="My Super Style"/></w:pPr></w:p>
          <w:r><w:rPr><w:rStyle w:val="Default Style"/></w:rPr></w:r>
          <w:p><w:pPr><w:pStyle w:val="Title"/></w:pPr></w:p>
          <w:p><w:pPr><w:pStyle w:val="UnknownStyle"/></w:pPr></w:p>
        </w:body>
      </w:document>
    `;

		it("should replace style names with their IDs from the style map", async () => {
			const styleMap = new Map<string, string>([
				["My Super Style", "SuperStyleID"],
				["default style", "DefaultStyleID"],
				["heading 1", "heading1id"],
			]);

			const mockDocx = await createMockDocx({ "word/document.xml": documentXml });
			const zip = (await JSZip.loadAsync(mockDocx)) as JSZip;
			const processor = new TemplateProcessor(Buffer.from(""), []);
			await (processor as any)._fixStyleReferencesInZip(zip, styleMap);

			const docFile = zip.file("word/document.xml");
			expect(docFile).not.toBeNull();
			const updatedXml = await docFile.async("text");

			expect(updatedXml).toContain('<w:pStyle w:val="SuperStyleID"');
			expect(updatedXml).toContain('<w:rStyle w:val="DefaultStyleID"');
			expect(updatedXml).toContain('<w:pStyle w:val="heading1id"');
			expect(updatedXml).toContain('<w:pStyle w:val="UnknownStyle"');
		});
	});

	describe("_updateSettingsXmlInZip", () => {
		it("should add the updateFields tag if it is missing", async () => {
			const settingsXml = `<w:settings xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"></w:settings>`;
			const mockDocx = await createMockDocx({ "word/settings.xml": settingsXml });
			const zip = (await JSZip.loadAsync(mockDocx)) as JSZip;
			const processor = new TemplateProcessor(Buffer.from(""), []);
			await (processor as any)._updateSettingsXmlInZip(zip);

			const settingsFile = zip.file("word/settings.xml");
			expect(settingsFile).not.toBeNull();
			const updatedXml = await settingsFile.async("text");

			expect(updatedXml).toContain('<w:updateFields w:val="true"/>');
		});

		it("should replace the updateFields tag if it has an incorrect value", async () => {
			const settingsXml = `<w:settings xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:updateFields w:val="false"/></w:settings>`;
			const mockDocx = await createMockDocx({ "word/settings.xml": settingsXml });
			const zip = (await JSZip.loadAsync(mockDocx)) as JSZip;
			const processor = new TemplateProcessor(Buffer.from(""), []);
			await (processor as any)._updateSettingsXmlInZip(zip);

			const settingsFile = zip.file("word/settings.xml");
			expect(settingsFile).not.toBeNull();
			const updatedXml = await settingsFile.async("text");

			expect(updatedXml).toContain('<w:updateFields w:val="true"/>');
			expect(updatedXml).not.toContain('w:val="false"');
		});

		it("should keep the tag unchanged if already correct (semantic check)", async () => {
			const settingsXml = `<w:settings xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:updateFields w:val="true"/></w:settings>`;
			const mockDocx = await createMockDocx({ "word/settings.xml": settingsXml });
			const zip = (await JSZip.loadAsync(mockDocx)) as JSZip;
			const processor = new TemplateProcessor(Buffer.from(""), []);
			await (processor as any)._updateSettingsXmlInZip(zip);

			const settingsFile = zip.file("word/settings.xml");
			expect(settingsFile).not.toBeNull();
			const updatedXml = await settingsFile.async("text");

			const dom = new DOMParser().parseFromString(updatedXml, "application/xml");
			const updateNode = dom.getElementsByTagName("w:updateFields")[0] as any;
			expect(updateNode).toBeDefined();
			expect(updateNode.getAttribute("w:val")).toBe("true");
		});
	});

	describe("merge (Integration Test)", () => {
		it("should process the document from start to finish", async () => {
			const templateFiles = {
				"word/document.xml": `<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r><w:t>{{gramax_content}}</w:t></w:r></w:p></w:body></w:document>`,
				"word/styles.xml": `<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
										<w:style w:type="paragraph" w:styleId="MyStyle"><w:name w:val="My Custom Style"/></w:style>
									</w:styles>`,
				"word/numbering.xml": `<w:numbering xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:abstractNum w:abstractNumId="1"><w:styleLink w:val="BulletList"/></w:abstractNum><w:abstractNum w:abstractNumId="2"><w:styleLink w:val="OrderedList"/></w:abstractNum></w:numbering>`,
				"docProps/core.xml": `<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><dc:title>Initial</dc:title></cp:coreProperties>`,
				"word/settings.xml": `<w:settings xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:zoom w:percent="100"/></w:settings>`,
				"[Content_Types].xml": `<?xml version="1.0" encoding="UTF-8"?>\n<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">\n    <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.template.main+xml"/>\n</Types>`,
			};
			const mockTemplate = await createMockDocx(templateFiles);

			const processor = new TemplateProcessor(
				Buffer.from(mockTemplate),
				[{ children: [new Paragraph({ text: "Hello", style: "MyCustomStyle" })] }],
				{ title: "Final Title" },
			);

			const resultBuffer = await processor.merge();
			const resultZip = await JSZip.loadAsync(new Uint8Array(resultBuffer));

			const docFile = resultZip.file("word/document.xml");
			expect(docFile).not.toBeNull();
			const finalDocXml = await docFile.async("text");

			const coreFile = resultZip.file("docProps/core.xml");
			expect(coreFile).not.toBeNull();
			const finalCoreXml = await coreFile.async("text");

			const settingsFile = resultZip.file("word/settings.xml");
			expect(settingsFile).not.toBeNull();
			const finalSettingsXml = await settingsFile.async("text");

			expect(finalDocXml).toContain("Hello");
			expect(finalDocXml).not.toContain("gramax_content");
			expect(finalDocXml).toContain(`w:val="MyStyle"`);
			expect(finalCoreXml).toContain("<dc:title>Final Title</dc:title>");
			expect(finalSettingsXml).toContain(`<w:updateFields w:val="true"/>`);
		});
	});
});
