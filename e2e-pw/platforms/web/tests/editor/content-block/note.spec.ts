import { md } from "@utils/utils";
import { editorTest } from "@web/fixtures/editor.fixture";

editorTest.describe("Note", () => {
	editorTest("exit quote with double Enter", async ({ editor }) => {
		await editor.setMarkdown(md`
			<note type="quote">

			text(*)

			</note>
		`);
		await editor.press("Enter Enter");
		await editor.type("text");
		await editor.assertMarkdown(md`
			<note type="quote">

			text

			</note>

			text
		`);
	});

	editorTest("code block delete does not split note", async ({ editor }) => {
		await editor.setMarkdown(md`
			<note>

			eljhrkjeqr

			a(*)

			eqjhrkjeqlr

			</note>
		`);
		await editor.clickToolbar("code");
		await editor.press("Backspace Backspace");
		await editor.assertMarkdown(
			md`
			<note>

			eljhrkjeqr

			eqjhrkjeqlr

			</note>
		`,
			{ ignoreTabs: true },
		);
	});

	editorTest("empty note does not delete on Enter", async ({ editor }) => {
		await editor.setMarkdown(md`
			<note>

			(*)

			</note>
		`);
		await editor.press("Enter");
		await editor.assertMarkdown(md`
			<note>



			</note>
		`);
	});

	editorTest("remove note", async ({ editor, sharedPage }) => {
		await editor.setMarkdown(md`
			<note type="info">

			(*)text123

			- text456

			- text789

			\`\`\`js
			console.log("text123");
			\`\`\`

			</note>
		`);
		await sharedPage.getByTestId("action-delete").click();

		await editor.assertMarkdown(md``);
	});

	editorTest("change note type via toolbar", async ({ editor, sharedPage }) => {
		await editor.setMarkdown(md`
			<note type="note">

			(*)text123

			</note>
		`);
		await editor.hoverToolbar("note");
		await sharedPage.getByRole("menuitem", { name: "Quote" }).click();
		await editor.assertMarkdown(md`
			<note type="quote">

			text123

			</note>
		`);
	});

	editorTest("delete at end of list item merges next list item with note into current", async ({ editor }) => {
		await editor.setMarkdown(md`
			-  gerger

			-  ergerr(*)

			-  <note type="lab">

			   ergregrg

			   </note>
		`);
		await editor.press("Delete");
		await editor.assertMarkdown(md`
			-  gerger

			-  ergerr

			   <note type="lab">

			   ergregrg

			   </note>
		`);
	});

	editorTest("note lifts when backspace is pressed at start of note after list", async ({ editor }) => {
		await editor.setMarkdown(md`
			- list item

			<note>

			(*)text

			</note>
		`);
		await editor.press("Backspace");
		await editor.assertMarkdown(md`
			-  list item

			text
		`);
	});

	editorTest(
		"notes doesn't merge with other notes when backspace is pressed between them in paragraph",
		async ({ editor }) => {
			await editor.setMarkdown(md`
			<note>

			text123

			</note>

			(*)text

			<note>

			text456

			</note>
		`);
			await editor.press("Backspace");
			await editor.assertMarkdown(md`
			<note>

			text123

			text

			</note>

			<note>

			text456

			</note>
		`);
		},
	);
});
