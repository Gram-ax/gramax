import * as JSZip from "jszip";
import { initModules } from "@app/resolveModule/backend";
import { readTemplateStyles, extractStylesData, normalizeStyleMapping } from "../../templateProcessing/stylesReader";

const createMockDocx = async (files: Record<string, string>): Promise<Uint8Array> => {
	const zip = new JSZip.default();
	for (const [path, content] of Object.entries(files)) {
		zip.file(path, content);
	}
	return zip.generateAsync({ type: "uint8array" });
};

describe("templateProcessing/stylesReader", () => {
	beforeAll(async () => {
		await initModules();
	});

	it("reads styles from a template archive", async () => {
		const stylesXml = `
      <w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
        <w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="heading 1"/></w:style>
        <w:style w:type="character" w:styleId="Strong"><w:name w:val="Strong"/></w:style>
        <w:style w:type="paragraph" w:styleId="ListParagraph"><w:name w:val="List Paragraph"/></w:style>
      </w:styles>
    `;
		const mockTemplate = await createMockDocx({ "word/styles.xml": stylesXml });
		const info = await readTemplateStyles(Buffer.from(mockTemplate));

		expect(info.mapping.get("heading 1")).toBe("Heading1");
		expect(info.mapping.get("List Paragraph")).toBe("ListParagraph");
		expect(info.paragraphIndents.get("ListParagraph")).toBeUndefined();
	});

	it("extracts paragraph indents and mappings", () => {
		const stylesXml = `
      <w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
        <w:style w:type="paragraph" w:styleId="ListParagraph">
          <w:name w:val="List Paragraph"/>
          <w:pPr><w:ind w:left="540" w:hanging="360"/></w:pPr>
        </w:style>
      </w:styles>
    `;
		const info = extractStylesData(stylesXml);
		expect(info.mapping.get("List Paragraph")).toBe("ListParagraph");
		expect(info.paragraphIndents.get("ListParagraph")).toEqual({ left: "540", hanging: "360", firstLine: null });
	});

	it("normalizes style names", () => {
		const normalized = normalizeStyleMapping(
			new Map([
				["Heading 1", "Heading1"],
				["List Paragraph", "ListParagraph"],
			]),
		);
		expect(normalized.get("heading1")).toBe("Heading1");
		expect(normalized.get("listparagraph")).toBe("ListParagraph");
	});
});
