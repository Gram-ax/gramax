import { initBackendModules } from "@app/resolveModule/backend";
import { DOMParser } from "@xmldom/xmldom";
import { applyTemplateListIndents } from "../../templateProcessing/listIndentApplier";
import type { TemplateStylesInfo } from "../../templateProcessing/types";
import { LIST_CONTINUATION_BOOKMARK, LIST_CONTINUATION_CAPTION } from "../../utils/listContinuation";

describe("templateProcessing/listIndentApplier", () => {
	const parser = new DOMParser();

	beforeAll(async () => {
		await initBackendModules();
	});

	const templateStyles: TemplateStylesInfo = {
		mapping: new Map([["List Paragraph", "ListParagraph"]]),
		paragraphIndents: new Map([["ListParagraph", { left: "600" }]]),
	};
	const normalized = new Map(
		Array.from(templateStyles.mapping.entries()).map(([key, value]) => [
			key.toLowerCase().replace(/\s+/g, ""),
			value,
		]),
	);

	it("applies continuation indents and cleans list styles", () => {
		const docXml = `
      <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
        <w:body>
          <w:p>
            <w:pPr>
              <w:pStyle w:val="ListParagraph"/>
              <w:numPr><w:ilvl w:val="0"/><w:numId w:val="1"/></w:numPr>
            </w:pPr>
            <w:r><w:t>Item</w:t></w:r>
          </w:p>
          <w:p>
            <w:pPr><w:pStyle w:val="ListParagraph"/></w:pPr>
            <w:r><w:t>Continuation</w:t></w:r>
          </w:p>
          <w:p>
            <w:pPr>
              <w:pStyle w:val="ListParagraph"/>
              <w:numPr><w:ilvl w:val="0"/><w:numId w:val="1"/></w:numPr>
            </w:pPr>
            <w:r><w:t>Numbered intro</w:t></w:r>
          </w:p>
          <w:p>
            <w:pPr>
              <w:pStyle w:val="ListParagraph"/>
              <w:numPr><w:ilvl w:val="0"/><w:numId w:val="1"/></w:numPr>
            </w:pPr>
            <w:r><w:t>Numbered intro</w:t></w:r>
          </w:p>
          <w:tbl>
            <w:tblPr><w:tblCaption w:val="${LIST_CONTINUATION_CAPTION}"/></w:tblPr>
            <w:tr>
              <w:tc>
                <w:p>
                  <w:pPr><w:pStyle w:val="ListParagraph"/></w:pPr>
                  <w:r><w:t>Cell</w:t></w:r>
                </w:p>
              </w:tc>
            </w:tr>
          </w:tbl>
        </w:body>
      </w:document>`;

		const numberingXml = `
      <w:numbering xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
        <w:abstractNum w:abstractNumId="0">
          <w:lvl w:ilvl="0">
            <w:pPr>
              <w:tabs><w:tab w:val="num" w:pos="720"/></w:tabs>
              <w:ind w:left="720" w:hanging="360"/>
            </w:pPr>
          </w:lvl>
        </w:abstractNum>
        <w:num w:numId="1"><w:abstractNumId w:val="0"/></w:num>
      </w:numbering>`;

		const doc = parser.parseFromString(docXml, "application/xml");
		const numbering = parser.parseFromString(numberingXml, "application/xml");

		applyTemplateListIndents(
			doc as unknown as Document,
			numbering as unknown as Document,
			templateStyles,
			normalized,
		);

		const paragraphs = doc.getElementsByTagName("w:p");
		const continuationP = paragraphs[1];
		const continuationIndent = continuationP.getElementsByTagName("w:ind")[0];
		expect(continuationIndent.getAttribute("w:left")).toBe("720");
		expect(continuationP.getElementsByTagName("w:pStyle").length).toBe(0);

		const table = doc.getElementsByTagName("w:tbl")[0];
		const tblInd = table.getElementsByTagName("w:tblInd")[0];
		expect(tblInd.getAttribute("w:w")).toBe("720");

		const cellParagraph = table.getElementsByTagName("w:p")[0];
		expect(cellParagraph.getElementsByTagName("w:pStyle").length).toBe(0);
		expect(cellParagraph.getElementsByTagName("w:ind").length).toBe(0);
	});

	it("uses continuation level from table caption to align nested blocks with parent list", () => {
		const docXml = `
      <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
        <w:body>
          <w:p>
            <w:pPr>
              <w:pStyle w:val="ListParagraph"/>
              <w:numPr><w:ilvl w:val="0"/><w:numId w:val="1"/></w:numPr>
            </w:pPr>
            <w:r><w:t>Top level</w:t></w:r>
          </w:p>
          <w:p>
            <w:pPr>
              <w:pStyle w:val="ListParagraph"/>
              <w:numPr><w:ilvl w:val="1"/><w:numId w:val="1"/></w:numPr>
            </w:pPr>
            <w:r><w:t>Nested item</w:t></w:r>
          </w:p>
          <w:tbl>
            <w:tblPr><w:tblCaption w:val="${LIST_CONTINUATION_CAPTION}:0"/></w:tblPr>
            <w:tr><w:tc><w:p><w:r><w:t>Note content</w:t></w:r></w:p></w:tc></w:tr>
          </w:tbl>
        </w:body>
      </w:document>`;

		const numberingXml = `
      <w:numbering xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
        <w:abstractNum w:abstractNumId="0">
          <w:lvl w:ilvl="0"><w:pPr><w:ind w:left="720" w:hanging="360"/></w:pPr></w:lvl>
          <w:lvl w:ilvl="1"><w:pPr><w:ind w:left="1440" w:hanging="360"/></w:pPr></w:lvl>
        </w:abstractNum>
        <w:num w:numId="1"><w:abstractNumId w:val="0"/></w:num>
      </w:numbering>`;

		const doc = parser.parseFromString(docXml, "application/xml");
		const numbering = parser.parseFromString(numberingXml, "application/xml");

		applyTemplateListIndents(
			doc as unknown as Document,
			numbering as unknown as Document,
			templateStyles,
			normalized,
		);

		const table = doc.getElementsByTagName("w:tbl")[0];
		const tblInd = table.getElementsByTagName("w:tblInd")[0];
		expect(tblInd.getAttribute("w:w")).toBe("720");
	});

	it("applies indents to paragraphs wrapped with continuation bookmark markers", () => {
		const docXml = `
      <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
        <w:body>
          <w:p>
            <w:pPr>
              <w:pStyle w:val="ListParagraph"/>
              <w:numPr><w:ilvl w:val="0"/><w:numId w:val="1"/></w:numPr>
            </w:pPr>
            <w:r><w:t>Numbered intro</w:t></w:r>
          </w:p>
          <w:p>
            <w:pPr><w:pStyle w:val="Picture"/></w:pPr>
            <w:bookmarkStart w:name="${LIST_CONTINUATION_BOOKMARK}" w:id="10"/>
            <w:r><w:t>Inline image</w:t></w:r>
          </w:p>
          <w:p>
            <w:pPr><w:pStyle w:val="PictureTitle"/></w:pPr>
            <w:r><w:t>Image caption</w:t></w:r>
            <w:bookmarkEnd w:id="10"/>
          </w:p>
          <w:p>
            <w:r><w:t>After list</w:t></w:r>
          </w:p>
        </w:body>
      </w:document>`;

		const numberingXml = `
      <w:numbering xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
        <w:abstractNum w:abstractNumId="0">
          <w:lvl w:ilvl="0">
            <w:pPr>
              <w:tabs><w:tab w:val="num" w:pos="720"/></w:tabs>
              <w:ind w:left="720" w:hanging="360"/>
            </w:pPr>
          </w:lvl>
        </w:abstractNum>
        <w:num w:numId="1"><w:abstractNumId w:val="0"/></w:num>
      </w:numbering>`;

		const doc = parser.parseFromString(docXml, "application/xml");
		const numbering = parser.parseFromString(numberingXml, "application/xml");

		applyTemplateListIndents(
			doc as unknown as Document,
			numbering as unknown as Document,
			templateStyles,
			normalized,
		);

		const getParagraphByText = (needle: string) =>
			Array.from(doc.getElementsByTagName("w:p")).find((p) =>
				Array.from(p.getElementsByTagName("w:t"))
					.map((node) => node.textContent ?? "")
					.join("")
					.includes(needle),
			);

		const pictureParagraph = getParagraphByText("Inline image");
		expect(pictureParagraph).toBeDefined();
		expect(pictureParagraph!.getElementsByTagName("w:pStyle")[0].getAttribute("w:val")).toBe("Picture");
		expect(pictureParagraph!.getElementsByTagName("w:ind")[0].getAttribute("w:left")).toBe("720");

		const captionParagraph = getParagraphByText("Image caption");
		expect(captionParagraph).toBeDefined();
		expect(captionParagraph!.getElementsByTagName("w:ind")[0].getAttribute("w:left")).toBe("720");

		const afterListParagraph = getParagraphByText("After list");
		expect(afterListParagraph).toBeDefined();
		expect(afterListParagraph!.getElementsByTagName("w:ind").length).toBe(0);
	});

	it("uses continuation level from bookmark markers when nested lists are active", () => {
		const docXml = `
      <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
        <w:body>
          <w:p>
            <w:pPr>
              <w:pStyle w:val="ListParagraph"/>
              <w:numPr><w:ilvl w:val="0"/><w:numId w:val="1"/></w:numPr>
            </w:pPr>
            <w:r><w:t>Parent item</w:t></w:r>
          </w:p>
          <w:p>
            <w:pPr>
              <w:pStyle w:val="ListParagraph"/>
              <w:numPr><w:ilvl w:val="1"/><w:numId w:val="1"/></w:numPr>
            </w:pPr>
            <w:r><w:t>Nested item</w:t></w:r>
          </w:p>
          <w:p>
            <w:pPr><w:pStyle w:val="Picture"/></w:pPr>
            <w:bookmarkStart w:name="${LIST_CONTINUATION_BOOKMARK}:0" w:id="90"/>
            <w:r><w:t>Continuation block</w:t></w:r>
            <w:bookmarkEnd w:id="90"/>
          </w:p>
        </w:body>
      </w:document>`;

		const numberingXml = `
      <w:numbering xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
        <w:abstractNum w:abstractNumId="0">
          <w:lvl w:ilvl="0"><w:pPr><w:ind w:left="720" w:hanging="360"/></w:pPr></w:lvl>
          <w:lvl w:ilvl="1"><w:pPr><w:ind w:left="1440" w:hanging="360"/></w:pPr></w:lvl>
        </w:abstractNum>
        <w:num w:numId="1"><w:abstractNumId w:val="0"/></w:num>
      </w:numbering>`;

		const doc = parser.parseFromString(docXml, "application/xml");
		const numbering = parser.parseFromString(numberingXml, "application/xml");

		applyTemplateListIndents(
			doc as unknown as Document,
			numbering as unknown as Document,
			templateStyles,
			normalized,
		);

		const pictureParagraph = Array.from(doc.getElementsByTagName("w:p")).find((p) =>
			Array.from(p.getElementsByTagName("w:t"))
				.map((node) => node.textContent ?? "")
				.join("")
				.includes("Continuation block"),
		);

		expect(pictureParagraph).toBeDefined();
		const indent = pictureParagraph!.getElementsByTagName("w:ind")[0];
		expect(indent.getAttribute("w:left")).toBe("720");
	});

	it("preserves list indent context across wrapper tables", () => {
		const docXml = `
      <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
        <w:body>
          <w:tbl>
            <w:tblPr><w:tblCaption w:val="${LIST_CONTINUATION_CAPTION}"/></w:tblPr>
            <w:tr>
              <w:tc>
                <w:p>
                  <w:pPr>
                    <w:pStyle w:val="ListParagraph"/>
                    <w:numPr><w:ilvl w:val="0"/><w:numId w:val="1"/></w:numPr>
                  </w:pPr>
                  <w:r><w:t>Wrapper</w:t></w:r>
                </w:p>
              </w:tc>
            </w:tr>
          </w:tbl>
          <w:p>
            <w:pPr><w:pStyle w:val="ListParagraph"/></w:pPr>
            <w:r><w:t>After table</w:t></w:r>
          </w:p>
        </w:body>
      </w:document>`;

		const numberingXml = `
      <w:numbering xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
        <w:abstractNum w:abstractNumId="0">
          <w:lvl w:ilvl="0">
            <w:pPr>
              <w:tabs><w:tab w:val="num" w:pos="720"/></w:tabs>
              <w:ind w:left="720" w:hanging="360"/>
            </w:pPr>
          </w:lvl>
        </w:abstractNum>
        <w:num w:numId="1"><w:abstractNumId w:val="0"/></w:num>
      </w:numbering>`;

		const doc = parser.parseFromString(docXml, "application/xml");
		const numbering = parser.parseFromString(numberingXml, "application/xml");

		applyTemplateListIndents(
			doc as unknown as Document,
			numbering as unknown as Document,
			templateStyles,
			normalized,
		);

		const afterTable = Array.from(doc.getElementsByTagName("w:p")).find((p) =>
			Array.from(p.getElementsByTagName("w:t"))
				.map((node) => node.textContent ?? "")
				.join("")
				.includes("After table"),
		);
		expect(afterTable).toBeDefined();
		const indent = afterTable!.getElementsByTagName("w:ind")[0];
		expect(indent.getAttribute("w:left")).toBe("720");
	});

	it("applies indents to picture titles and keeps style", () => {
		const docXml = `
      <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
        <w:body>
          <w:p>
            <w:pPr>
              <w:pStyle w:val="ListParagraph"/>
              <w:numPr><w:ilvl w:val="0"/><w:numId w:val="1"/></w:numPr>
            </w:pPr>
            <w:r><w:t>Item</w:t></w:r>
          </w:p>
          <w:p>
            <w:pPr><w:pStyle w:val="PictureTitle"/></w:pPr>
            <w:r><w:t>Caption</w:t></w:r>
          </w:p>
          <w:p>
            <w:pPr><w:pStyle w:val="ListParagraph"/></w:pPr>
            <w:r><w:t>After caption</w:t></w:r>
          </w:p>
        </w:body>
      </w:document>`;

		const numberingXml = `
      <w:numbering xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
        <w:abstractNum w:abstractNumId="0">
          <w:lvl w:ilvl="0">
            <w:pPr>
              <w:tabs><w:tab w:val="num" w:pos="720"/></w:tabs>
              <w:ind w:left="720" w:hanging="360"/>
            </w:pPr>
          </w:lvl>
        </w:abstractNum>
        <w:num w:numId="1"><w:abstractNumId w:val="0"/></w:num>
      </w:numbering>`;

		const doc = parser.parseFromString(docXml, "application/xml");
		const numbering = parser.parseFromString(numberingXml, "application/xml");

		applyTemplateListIndents(
			doc as unknown as Document,
			numbering as unknown as Document,
			templateStyles,
			normalized,
		);

		const caption = Array.from(doc.getElementsByTagName("w:p")).find((p) =>
			Array.from(p.getElementsByTagName("w:t"))
				.map((node) => node.textContent ?? "")
				.join("")
				.includes("Caption"),
		);
		expect(caption).toBeDefined();
		expect(caption!.getElementsByTagName("w:pStyle")[0].getAttribute("w:val")).toBe("PictureTitle");
		expect(caption!.getElementsByTagName("w:ind")[0].getAttribute("w:left")).toBe("720");

		const afterCaption = Array.from(doc.getElementsByTagName("w:p")).find((p) =>
			Array.from(p.getElementsByTagName("w:t"))
				.map((node) => node.textContent ?? "")
				.join("")
				.includes("After caption"),
		);
		expect(afterCaption).toBeDefined();
		expect(afterCaption!.getElementsByTagName("w:ind")[0].getAttribute("w:left")).toBe("720");
	});

	it("treats note/tabs/code tables as list continuations", () => {
		const docXml = `
      <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
        <w:body>
          <w:p>
            <w:pPr>
              <w:pStyle w:val="ListParagraph"/>
              <w:numPr><w:ilvl w:val="0"/><w:numId w:val="1"/></w:numPr>
            </w:pPr>
            <w:r><w:t>Before note</w:t></w:r>
          </w:p>
          <w:tbl>
            <w:tblPr><w:tblStyle w:val="Tip"/><w:tblCaption w:val="${LIST_CONTINUATION_CAPTION}"/></w:tblPr>
            <w:tr><w:tc><w:p><w:r><w:t>Note content</w:t></w:r></w:p></w:tc></w:tr>
          </w:tbl>
        </w:body>
      </w:document>`;

		const numberingXml = `
      <w:numbering xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
        <w:abstractNum w:abstractNumId="0">
          <w:lvl w:ilvl="0">
            <w:pPr><w:ind w:left="720" w:hanging="360"/></w:pPr>
          </w:lvl>
        </w:abstractNum>
        <w:num w:numId="1"><w:abstractNumId w:val="0"/></w:num>
      </w:numbering>`;

		const doc = parser.parseFromString(docXml, "application/xml");
		const numbering = parser.parseFromString(numberingXml, "application/xml");
		applyTemplateListIndents(
			doc as unknown as Document,
			numbering as unknown as Document,
			templateStyles,
			normalized,
		);

		const table = doc.getElementsByTagName("w:tbl")[0];
		const tblInd = table.getElementsByTagName("w:tblInd")[0];
		expect(tblInd.getAttribute("w:w")).toBe("720");
	});

	it("does not indent tables that are outside of list context", () => {
		const docXml = `
      <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
        <w:body>
          <w:p>
            <w:pPr>
              <w:pStyle w:val="ListParagraph"/>
              <w:numPr><w:ilvl w:val="0"/><w:numId w:val="1"/></w:numPr>
            </w:pPr>
            <w:r><w:t>Numbered intro</w:t></w:r>
          </w:p>
          <w:tbl>
            <w:tblPr><w:tblCaption w:val="${LIST_CONTINUATION_CAPTION}"/></w:tblPr>
            <w:tr>
              <w:tc>
                <w:p>
                  <w:pPr><w:pStyle w:val="ListParagraph"/></w:pPr>
                  <w:r><w:t>List table</w:t></w:r>
                </w:p>
              </w:tc>
            </w:tr>
          </w:tbl>
          <w:tbl>
            <w:tr><w:tc><w:p><w:r><w:t>Standalone table</w:t></w:r></w:p></w:tc></w:tr>
          </w:tbl>
        </w:body>
      </w:document>`;

		const numberingXml = `
      <w:numbering xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
        <w:abstractNum w:abstractNumId="0">
          <w:lvl w:ilvl="0"><w:pPr><w:ind w:left="720" w:hanging="360"/></w:pPr></w:lvl>
        </w:abstractNum>
        <w:num w:numId="1"><w:abstractNumId w:val="0"/></w:num>
      </w:numbering>`;

		const doc = parser.parseFromString(docXml, "application/xml");
		const numbering = parser.parseFromString(numberingXml, "application/xml");

		applyTemplateListIndents(
			doc as unknown as Document,
			numbering as unknown as Document,
			templateStyles,
			normalized,
		);

		const tables = doc.getElementsByTagName("w:tbl");
		expect(tables[0].getElementsByTagName("w:tblInd")[0].getAttribute("w:w")).toBe("720");
		expect(tables[1].getElementsByTagName("w:tblInd").length).toBe(0);
	});
});
