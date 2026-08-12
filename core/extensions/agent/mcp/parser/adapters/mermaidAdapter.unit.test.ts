import Path from "@core/FileProvider/Path/Path";
import { ItemType } from "@core/FileStructue/Item/ItemType";
import type { ArticleAdapterContext } from "./adapter";
import { MermaidAdapter } from "./mermaidAdapter";

const mermaidAdapter = new MermaidAdapter();

const articleItem = {
	type: ItemType.article,
	props: {},
	ref: { path: new Path("docs/section/article.md") },
};

function createContext(): ArticleAdapterContext {
	return {
		item: articleItem as never,
		catalog: { name: "docs" } as never,
		app: {} as never,
		ctx: {} as never,
		commands: {} as never,
	};
}

describe("mermaidAdapter", () => {
	test("expandToAgentView leaves markdown without mermaid tags unchanged", async () => {
		const source = "# Title\n\nplain text";
		expect(await mermaidAdapter.expandToAgentView(source, createContext())).toBe(source);
	});

	test("expandToAgentView rejects empty-path mermaid tag", async () => {
		await expect(mermaidAdapter.expandToAgentView('<mermaid title="T" />', createContext())).rejects.toThrow(
			"Empty path to mermaid diagram",
		);
	});

	test("applyAgentViewToStorage rejects path outside article directory", async () => {
		await expect(
			mermaidAdapter.applyAgentViewToStorage(
				'<mermaid path="../../../etc/passwd">\ngraph TD\n</mermaid>',
				createContext(),
			),
		).rejects.toThrow("Path resolves outside base path");
	});

	test("normalizeBody replaces literal \\n with <br>", () => {
		expect(MermaidAdapter.normalizeBody('A["a\\nb"]')).toBe('A["a<br>b"]');
	});

	test("normalizeBody trims leading blank lines and keeps indentation", () => {
		const formatAgentBlock = (body: string) => `<mermaid path="./x.mermaid">\n${body}\n</mermaid>`;
		const captureBody = (block: string) => {
			const m = /<mermaid(\s[^>]*)?>([\s\S]*?)<\/mermaid>/i.exec(block);
			return MermaidAdapter.normalizeBody(m?.[2] ?? "");
		};
		const blankLinesBeforeScript = (block: string) => {
			const openEnd = block.indexOf(">");
			if (openEnd === -1) return -1;
			const inner = block.slice(openEnd + 1);
			const closeIdx = inner.indexOf("</mermaid>");
			const body = closeIdx === -1 ? inner : inner.slice(0, closeIdx);
			let blanks = 0;
			for (const line of body.split("\n")) {
				if (line.trim() === "") blanks += 1;
				else break;
			}
			return blanks;
		};

		let body = "sequenceDiagram\n    A->>B";
		let block = formatAgentBlock(body);
		expect(blankLinesBeforeScript(block)).toBe(1);
		body = captureBody(block);
		block = formatAgentBlock(body);
		expect(blankLinesBeforeScript(block)).toBe(1);
		body = captureBody(block);
		block = formatAgentBlock(body);
		expect(blankLinesBeforeScript(block)).toBe(1);
	});
});
