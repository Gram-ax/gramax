import { md } from "@utils/utils";
import { editorTest } from "@web/fixtures/editor.fixture";

editorTest.describe("List item to heading", () => {
	const singleItemCases = [
		{ name: "bullet list via hotkey", markdown: "-  text(*)", action: "hotkey" as const },
		{ name: "ordered list via hotkey", markdown: "1. text(*)", action: "hotkey" as const },
		{ name: "bullet list via toolbar", markdown: "-  text(*)", action: "toolbar" as const },
	];

	for (const { name, markdown, action } of singleItemCases) {
		editorTest(`convert single ${name} to H2`, async ({ editor, sharedPage }) => {
			await editor.setMarkdown(markdown);
			if (action === "hotkey") await editor.press("ControlOrMeta+Alt+2");
			else {
				await editor.clickToolbar("headers");
				await sharedPage.getByRole("menuitem", { name: "Heading 2" }).click();
			}
			await editor.assertMarkdown("## text");
		});
	}

	editorTest("convert middle item splits the list", async ({ editor }) => {
		await editor.setMarkdown(md`
			-  first

			-  second(*)

			-  third
		`);
		await editor.press("ControlOrMeta+Alt+2");
		await editor.assertMarkdown(md`
			-  first

			## second

			-  third
		`);
	});

	editorTest("convert first item leaves only trailing list", async ({ editor }) => {
		await editor.setMarkdown(md`
			-  first(*)

			-  second

			-  third
		`);
		await editor.press("ControlOrMeta+Alt+2");
		await editor.assertMarkdown(md`
			## first

			-  second

			-  third
		`);
	});

	editorTest("convert last item leaves only preceding list", async ({ editor }) => {
		await editor.setMarkdown(md`
			-  first

			-  second

			-  last(*)
		`);
		await editor.press("ControlOrMeta+Alt+2");
		await editor.assertMarkdown(md`
			-  first

			-  second

			## last
		`);
	});

	editorTest("convert item with nested sub-list lifts nested items", async ({ editor }) => {
		await editor.setMarkdown(md`
			-  parent(*)

			   -  child
		`);
		await editor.press("ControlOrMeta+Alt+2");
		await editor.assertMarkdown(md`
			## parent

			-  child
		`);
	});

	editorTest("convert multiple selected items to headings simultaneously", async ({ editor }) => {
		await editor.setMarkdown(md`
			-  first(*)

			-  second

			-  third
		`);
		await editor.press("Shift+ArrowDown");
		await editor.press("ControlOrMeta+Alt+2");
		await editor.assertMarkdown(md`
			## first

			## second

			-  third
		`);
	});
});
