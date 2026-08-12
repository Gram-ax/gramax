import { createCodeBlockFragment } from "@ext/markdown/elements/copyArticles/handlers/copy";
import { Fragment, Schema } from "@tiptap/pm/model";

const schema = new Schema({
	nodes: {
		doc: { content: "block+" },
		paragraph: { group: "block", content: "inline*" },
		code_block: { group: "block", content: "text*", code: true, marks: "", attrs: { language: { default: null } } },
		text: { group: "inline" },
	},
	marks: {},
});

test("copied code is wrapped in a single code block, preserving language and newlines", () => {
	const content = Fragment.from(schema.text("line1\nline2"));

	const fragment = createCodeBlockFragment(content, schema, { language: "ts" });

	expect(fragment.childCount).toBe(1);
	const codeBlock = fragment.firstChild;
	expect(codeBlock.type.name).toBe("code_block");
	expect(codeBlock.attrs.language).toBe("ts");
	expect(codeBlock.textContent).toBe("line1\nline2");
});

test("empty selection yields an empty code block rather than paragraphs", () => {
	const fragment = createCodeBlockFragment(Fragment.empty, schema, { language: null });

	expect(fragment.childCount).toBe(1);
	expect(fragment.firstChild.type.name).toBe("code_block");
	expect(fragment.firstChild.textContent).toBe("");
});
