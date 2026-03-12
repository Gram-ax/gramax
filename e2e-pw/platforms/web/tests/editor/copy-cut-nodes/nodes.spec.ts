import { md } from "@utils/utils";
import { editorTest } from "@web/fixtures/editor.fixture";
import { createFileTree } from "@web/utils";

const DRAWIO_SVG = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" width="211px" height="101px" viewBox="-0.5 -0.5 211 101" content="&lt;mxfile&gt;&lt;diagram id=&quot;0&quot; name=&quot;Page-1&quot;&gt;&lt;mxGraphModel&gt;&lt;root&gt;&lt;mxCell id=&quot;0&quot;/&gt;&lt;mxCell id=&quot;1&quot; parent=&quot;0&quot;/&gt;&lt;/root&gt;&lt;/mxGraphModel&gt;&lt;/diagram&gt;&lt;/mxfile&gt;"><defs/><g><rect x="0" y="20" width="120" height="60" rx="9" ry="9" fill="rgb(255,255,255)" stroke="rgb(0,0,0)" pointer-events="all"/></g></svg>`;

editorTest.describe("Copy-Cut Nodes", () => {
	editorTest("copy list", async ({ editor }) => {
		await editor.setMarkdown(md`
			-  apricot

			-  tangerine(*)
		`);
		await editor.press("ControlOrMeta+A ControlOrMeta+C ControlOrMeta+V");
		await editor.assertMarkdownContains(md`
			-  apricot

			-  tangerine
		`);
	});

	editorTest("insert list at current level", async ({ editor }) => {
		await editor.setMarkdown(md`
			-  apricot

			-  tangerine(*)
		`);
		await editor.press("ControlOrMeta+A ControlOrMeta+C ArrowRight Enter ControlOrMeta+V");
		await editor.assertMarkdownContains(md`
			-  apricot

			-  tangerine

			-  apricot

			-  tangerine
		`);
	});

	editorTest("insert list to next nesting level", async ({ editor }) => {
		await editor.setMarkdown(md`
			-  apricot

			-  tangerine(*)
		`);
		await editor.press("ControlOrMeta+A ControlOrMeta+C ArrowRight ControlOrMeta+V");
		await editor.assertMarkdownContains(md`
			-  apricot

			-  tangerine

			   -  apricot

			   -  tangerine
		`);
	});

	editorTest("copy and paste into code block", async ({ editor }) => {
		await editor.setMarkdown("(*)hello world");
		await editor.press("ControlOrMeta+A ControlOrMeta+X");
		await editor.clickToolbar("code");
		await editor.press("ControlOrMeta+V");
		await editor.assertMarkdownContains(md`
			\`\`\`
			hello world
			\`\`\`
		`);
	});

	editorTest("copy drawio", async ({ editor, sharedPage }) => {
		await createFileTree(sharedPage, {
			editor: { "new-article.svg": DRAWIO_SVG },
		});

		await editor.setMarkdown(md`
				text

				<drawio path="./new-article.svg" width="211px" height="101px"/>
			`);
		await editor.press("ControlOrMeta+A ControlOrMeta+C ControlOrMeta+V");
		await editor.assertMarkdownContains('<drawio path="./new-article');
	});
});
