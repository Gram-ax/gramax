import { md } from "@utils/utils";
import { editorTest } from "@web/fixtures/editor.fixture";

editorTest.describe("Move list item at boundaries", () => {
	editorTest("last item pressing down detaches from the list and moves past next paragraph", async ({ editor }) => {
		await editor.setMarkdown(md`
			-  first

			-  last(*)

			paragraph
		`);
		await editor.press("ControlOrMeta+ArrowDown");
		await editor.assertMarkdown(md`
			-  first

			paragraph

			-  last
		`);
	});

	editorTest("last item pressing down multiple times passes through multiple blocks", async ({ editor }) => {
		await editor.setMarkdown(md`
			-  first

			-  last(*)

			paragraph-a

			paragraph-b
		`);
		await editor.press("ControlOrMeta+ArrowDown");
		await editor.press("ControlOrMeta+ArrowDown");
		await editor.assertMarkdown(md`
			-  first

			paragraph-a

			paragraph-b

			-  last
		`);
	});

	editorTest("last item pressing down attaches to the next list and can pass through it", async ({ editor }) => {
		await editor.setMarkdown(md`
			-  apple

			-  banana(*)

			paragraph

			-  cherry

			-  date
		`);
		await editor.press("ControlOrMeta+ArrowDown");
		await editor.assertMarkdown(md`
			-  apple

			paragraph

			-  banana

			-  cherry

			-  date
		`);
		await editor.press("ControlOrMeta+ArrowDown");
		await editor.assertMarkdown(md`
			-  apple

			paragraph

			-  cherry

			-  banana

			-  date
		`);
	});

	editorTest("single-item list pressing down moves below the next paragraph", async ({ editor }) => {
		await editor.setMarkdown(md`
			-  only(*)

			paragraph
		`);
		await editor.press("ControlOrMeta+ArrowDown");
		await editor.assertMarkdown(md`
			paragraph

			-  only
		`);
	});

	editorTest("last item pressing down when nothing is below does nothing", async ({ editor }) => {
		await editor.setMarkdown(md`
			-  first

			-  last(*)
		`);
		await editor.press("ControlOrMeta+ArrowDown");
		await editor.assertMarkdown(md`
			-  first

			-  last
		`);
	});

	editorTest(
		"first item pressing up detaches from the list and moves above the previous paragraph",
		async ({ editor }) => {
			await editor.setMarkdown(md`
			paragraph

			-  first(*)

			-  last
		`);
			await editor.press("ControlOrMeta+ArrowUp");
			await editor.assertMarkdown(md`
			-  first

			paragraph

			-  last
		`);
		},
	);
});
