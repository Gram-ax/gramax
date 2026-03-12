import { md } from "@utils/utils";
import { editorTest } from "@web/fixtures/editor.fixture";

editorTest.describe("Move Nodes", () => {
	editorTest("move paragraph up and down", async ({ editor }) => {
		await editorTest.step("move up", async () => {
			await editor.setMarkdown(md`
				Garlic

				Green onion

				Parsley(*)
			`);
			await editor.press("ControlOrMeta+ArrowUp");
			await editor.assertMarkdown(md`
				Garlic

				Parsley

				Green onion
			`);
		});

		await editorTest.step("move down", async () => {
			await editor.setMarkdown(md`
				Garlic(*)

				Green onion

				Parsley
			`);
			await editor.press("ControlOrMeta+ArrowDown");
			await editor.assertMarkdown(md`
				Green onion

				Garlic

				Parsley
			`);
		});
	});

	editorTest("move list between blocks", async ({ editor }) => {
		await editorTest.step("move down", async () => {
			await editor.setMarkdown(md`
				-  (*)Garlic

				-  Green onion

				Parsley

				Dill
			`);
			await editor.press("ControlOrMeta+ArrowDown");
			await editor.assertMarkdown(md`
				Parsley

				-  Garlic

				-  Green onion

				Dill
			`);
		});

		await editorTest.step("move up two blocks", async () => {
			await editor.setMarkdown(md`
				Parsley

				Dill

				-  (*)Garlic

				-  Green onion
			`);
			await editor.press("ControlOrMeta+ArrowUp ControlOrMeta+ArrowUp");
			await editor.assertMarkdown(md`
				-  Garlic

				-  Green onion

				Parsley

				Dill
			`);
		});
	});

	editorTest("move note up and down", async ({ editor }) => {
		await editorTest.step("move up", async () => {
			await editor.setMarkdown(md`
				Parsley

				<note title="Fruits">

				Nectarine(*)

				</note>
			`);
			await editor.press("ControlOrMeta+ArrowUp");
			await editor.assertMarkdown(md`
				<note title="Fruits">

				Nectarine

				</note>

				Parsley
			`);
		});

		await editorTest.step("move down", async () => {
			await editor.setMarkdown(md`
				<note title="Fruits">

				Nectarine(*)

				</note>

				Parsley
			`);
			await editor.press("ControlOrMeta+ArrowDown");
			await editor.assertMarkdown(md`
				Parsley

				<note title="Fruits">

				Nectarine

				</note>
			`);
		});
	});

	editorTest("move list item up and down", async ({ editor }) => {
		await editorTest.step("move down two positions", async () => {
			await editor.setMarkdown(md`
				-  parsley

				-  green onion(*)

				-  orange

				-  tangerine

				-  grape
			`);
			await editor.press("ControlOrMeta+ArrowDown ControlOrMeta+ArrowDown");
			await editor.assertMarkdown(md`
				-  parsley

				-  orange

				-  tangerine

				-  green onion

				-  grape
			`);
		});

		await editorTest.step("move up two positions", async () => {
			await editor.setMarkdown(md`
				-  parsley

				-  green onion

				-  orange

				-  tangerine(*)

				-  grape
			`);
			await editor.press("ControlOrMeta+ArrowUp ControlOrMeta+ArrowUp");
			await editor.assertMarkdown(md`
				-  parsley

				-  tangerine

				-  green onion

				-  orange

				-  grape
			`);
		});
	});

	editorTest("move nested list item up and down", async ({ editor }) => {
		await editorTest.step("move up two positions", async () => {
			await editor.setMarkdown(md`
				-  parsley

				   -  green onion

				      -  orange

				         -  tangerine

				         -

				         -  grape(*)
			`);
			await editor.press("ControlOrMeta+ArrowUp ControlOrMeta+ArrowUp");
			await editor.assertMarkdown(md`
				-  parsley

				   -  green onion

				      -  orange

				         -  grape

				         -  tangerine

				         -
			`);
		});

		await editorTest.step("move down two positions", async () => {
			await editor.setMarkdown(md`
				-  parsley

				   -  green onion

				      -  orange

				         -  (*)

				         -  tangerine

				         -  grape
			`);
			await editor.press("ControlOrMeta+ArrowDown ControlOrMeta+ArrowDown");
			await editor.assertMarkdown(md`
				-  parsley

				   -  green onion

				      -  orange

				         -  tangerine

				         -  grape

				         -
			`);
		});
	});
});
