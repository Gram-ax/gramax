import { md } from "@utils/utils";
import { editorTest } from "@web/fixtures/editor.fixture";
import { createFileTree } from "@web/utils";

const DRAWIO_SVG = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" width="211px" height="101px" viewBox="-0.5 -0.5 211 101" content="&lt;mxfile&gt;&lt;diagram id=&quot;0&quot; name=&quot;Page-1&quot;&gt;&lt;mxGraphModel&gt;&lt;root&gt;&lt;mxCell id=&quot;0&quot;/&gt;&lt;mxCell id=&quot;1&quot; parent=&quot;0&quot;/&gt;&lt;/root&gt;&lt;/mxGraphModel&gt;&lt;/diagram&gt;&lt;/mxfile&gt;"><defs/><g><rect x="0" y="20" width="120" height="60" rx="9" ry="9" fill="rgb(255,255,255)" stroke="rgb(0,0,0)" pointer-events="all"/></g></svg>`;

editorTest.describe("Join Lists", () => {
	editorTest("join ordered lists with note between", async ({ editor }) => {
		await editor.setMarkdown(md`
			1. text

			<note>


			</note>

			1. (*)text
		`);
		await editor.press("Shift+ArrowUp Backspace");
		await editor.assertMarkdown(md`
			1. text

			2. text
		`);
	});

	editorTest("join ordered lists with table between", async ({ editor, sharedPage }) => {
		await editor.setMarkdown(md`
			1. text

			|(*)|  ||
			|-|-|-|
			||||
			||||

			1. text
		`);
		await sharedPage.getByTestId("table-select-all").click();
		await editor.press("Backspace");
		await editor.assertMarkdown(md`
			1. text

			2. text
		`);
	});

	editorTest("join ordered lists with drawio between", async ({ editor, sharedPage }) => {
		await createFileTree(sharedPage, {
			editor: { "new-article.svg": DRAWIO_SVG },
		});

		await editor.setMarkdown(md`
				1. text

				<drawio path="./new-article.svg" width="211px" height="101px"/>

				1. text
			`);
		const drawio = sharedPage.getByTestId("drawio");
		await drawio.hover();
		await sharedPage.getByTestId("action-delete").click();
		await editor.assertMarkdown(md`
				1. text

				2. text
			`);
	});
});
