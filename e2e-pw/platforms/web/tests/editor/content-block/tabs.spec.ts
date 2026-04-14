import { md } from "@utils/utils";
import { editorTest } from "@web/fixtures/editor.fixture";

editorTest.describe("Tabs", () => {
	editorTest("create tabs", async ({ editor, sharedPage }) => {
		await editorTest.step("create first tab", async () => {
			await editor.hoverToolbar("pencil-ruler");
			await sharedPage.getByRole("menuitem", { name: "Tab" }).click();
			await editor.type("first");
			await editor.assertMarkdown(
				md`
			<tabs>

				<tab name="Tab">

					first

				</tab>

			</tabs>
		`,
				{ ignoreTabs: true },
			);
		});

		await editorTest.step("create second tab", async () => {
			await sharedPage.locator('[data-qa="qa-add-tab"]').click();
			await editor.type("second");
			await editor.assertMarkdown(
				md`
				<tabs>

					<tab name="Tab">

						first

						</tab>

					<tab name="Tab">

						second

						</tab>

				</tabs>
			`,
				{ ignoreTabs: true },
			);
		});
	});

	editorTest("delete tab content", async ({ editor }) => {
		await editor.setMarkdown(md`
			<tabs>

			<tab name="Tab">

			<note>

			(*)some content

			</note>

			</tab>

			</tabs>
		`);
		await editor.press("ControlOrMeta+Backspace");
		await editor.assertMarkdownContains("<tabs>");
		await editor.assertMarkdownContains("</tabs>");
	});

	editorTest("delete tabs", async ({ editor, sharedPage }) => {
		await editor.hoverToolbar("pencil-ruler");
		await sharedPage.getByRole("menuitem", { name: "Tab" }).click();
		await sharedPage.locator('[data-qa="qa-delete-tabs"]').click();
		await editor.assertMarkdown("");
	});

	editorTest("create list in tab", async ({ editor }) => {
		await editor.setMarkdown(md`
			<tabs>

			<tab name="Tab">

			(*)

			</tab>

			</tabs>
		`);
		await editor.press("ControlOrMeta+Shift+8");
		await editor.type("text");
		await editor.assertMarkdownContains("-  text");
	});

	editorTest("paste html tabs", async ({ editor }) => {
		await editor.pasteHtml(`
   <meta charset='utf-8'>
      <div xmlns="http://www.w3.org/1999/xhtml">
        <p>test start</p>
        <tabs-react-component childattrs="[{&quot;name&quot;:&quot;test1&quot;,&quot;idx&quot;:0},{&quot;name&quot;:&quot;test2&quot;,&quot;idx&quot;:1},{&quot;name&quot;:&quot;test3&quot;,&quot;idx&quot;:2}]">
          <tab-react-component name="Вкладка" idx="0"><p>1</p></tab-react-component>
          <tab-react-component name="Вкладка" idx="1"><p>2</p></tab-react-component>
          <tab-react-component name="Вкладка" idx="2"><p>3</p></tab-react-component>
        </tabs-react-component>
        <p>test end</p>
      </div>
`);
		await editor.assertMarkdown(
			md`
		test start

		<tabs>

			<tab name="test1">

			1

			</tab>

			<tab name="test2">

			2

			</tab>

			<tab name="test3">

				3

			</tab>

		</tabs>

		test end
	`,
			{ ignoreTabs: true },
		);
		await editor.assertMarkdownContains("</tabs>");
	});

	editorTest("backspace after tabs", async ({ editor }) => {
		await editor.setMarkdown(md`
			<tabs>

			<tab name="Tab">

			123

			</tab>

			</tabs>

			(*)text
		`);
		await editor.press("Backspace");
		await editor.assertMarkdown(md`
			<tabs>

			<tab name="Tab">

			123

			text

			</tab>

			</tabs>
		`);
	});
});
