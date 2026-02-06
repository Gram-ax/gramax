import { initBackendModules } from "@app/resolveModule/backend";
import { DOMParser } from "@xmldom/xmldom";
import { fitIndentedContentWidth } from "../../templateProcessing/contentScaler";

describe("templateProcessing/contentScaler", () => {
	const parser = new DOMParser();

	beforeAll(async () => {
		await initBackendModules();
	});

	it("scales drawings based on the remaining width", () => {
		const docXml = `
      <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">
        <w:body>
          <w:p>
            <w:pPr><w:ind w:left="2000"/></w:pPr>
            <w:r>
              <w:drawing>
                <wp:inline>
                  <wp:extent cx="8000000" cy="4000000"/>
                  <a:graphic><a:graphicData/></a:graphic>
                </wp:inline>
              </w:drawing>
            </w:r>
          </w:p>
          <w:sectPr>
            <w:pgSz w:w="12000"/>
            <w:pgMar w:left="0" w:right="0"/>
          </w:sectPr>
        </w:body>
      </w:document>`;

		const doc = parser.parseFromString(docXml, "application/xml");
		fitIndentedContentWidth(doc as unknown as Document);

		const extent = doc.getElementsByTagName("wp:extent")[0];
		expect(extent.getAttribute("cx")).toBe("6350000");
		expect(extent.getAttribute("cy")).toBe("3175000");
	});

	it("reduces table width when indent shrinks available space", () => {
		const docXml = `
      <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
        <w:body>
          <w:tbl>
            <w:tblPr>
              <w:tblInd w:w="3000" w:type="dxa"/>
              <w:tblW w:w="11000" w:type="dxa"/>
            </w:tblPr>
            <w:tblGrid>
              <w:gridCol w:w="5500"/>
              <w:gridCol w:w="5500"/>
            </w:tblGrid>
            <w:tr>
              <w:tc>
                <w:tcPr><w:tcW w:w="5500"/></w:tcPr>
                <w:p><w:r><w:t>Cell</w:t></w:r></w:p>
              </w:tc>
            </w:tr>
          </w:tbl>
          <w:sectPr>
            <w:pgSz w:w="12000"/>
            <w:pgMar w:left="0" w:right="0"/>
          </w:sectPr>
        </w:body>
      </w:document>`;

		const doc = parser.parseFromString(docXml, "application/xml");
		fitIndentedContentWidth(doc as unknown as Document);

		const tblW = doc.getElementsByTagName("w:tblW")[0];
		expect(tblW.getAttribute("w:w")).toBe("9000");
		const gridCol = doc.getElementsByTagName("w:gridCol")[0];
		expect(gridCol.getAttribute("w:w")).toBe("4500");
		const tcW = doc.getElementsByTagName("w:tcW")[0];
		expect(tcW.getAttribute("w:w")).toBe("4500");
	});
});
