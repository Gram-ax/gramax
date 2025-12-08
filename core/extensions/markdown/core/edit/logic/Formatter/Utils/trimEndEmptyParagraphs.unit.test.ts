import { JSONContent } from "@tiptap/react";
import trimEndEmptyParagraphs from "./trimEndEmptyParagraphs";

describe("trimEndEmptyParagraphs", () => {
	it("does not modify empty array", () => {
		const content: JSONContent[] = [];
		trimEndEmptyParagraphs(content);
		expect(content).toEqual([]);
	});

	it("does not modify array without empty paragraphs", () => {
		const content: JSONContent[] = [
			{ type: "paragraph", content: [{ type: "text", text: "Текст" }] },
			{ type: "heading", attrs: { level: 1 }, content: [{ type: "text", text: "Заголовок" }] },
		];
		const originalLength = content.length;
		trimEndEmptyParagraphs(content);
		expect(content.length).toBe(originalLength);
		expect(content).toEqual([
			{ type: "paragraph", content: [{ type: "text", text: "Текст" }] },
			{ type: "heading", attrs: { level: 1 }, content: [{ type: "text", text: "Заголовок" }] },
		]);
	});

	it("removes one empty paragraph at the end", () => {
		const content: JSONContent[] = [
			{ type: "paragraph", content: [{ type: "text", text: "Текст" }] },
			{ type: "paragraph" },
		];
		trimEndEmptyParagraphs(content);
		expect(content).toEqual([{ type: "paragraph", content: [{ type: "text", text: "Текст" }] }]);
	});

	it("removes multiple empty paragraphs at the end", () => {
		const content: JSONContent[] = [
			{ type: "paragraph", content: [{ type: "text", text: "Текст" }] },
			{ type: "paragraph" },
			{ type: "paragraph", content: [] },
			{ type: "paragraph" },
		];
		trimEndEmptyParagraphs(content);
		expect(content).toEqual([{ type: "paragraph", content: [{ type: "text", text: "Текст" }] }]);
	});

	it("removes all empty paragraphs if array consists only of them", () => {
		const content: JSONContent[] = [
			{ type: "paragraph" },
			{ type: "paragraph", content: [] },
			{ type: "paragraph" },
		];
		trimEndEmptyParagraphs(content);
		expect(content).toEqual([]);
	});

	it("does not remove empty paragraphs in the middle of array", () => {
		const content: JSONContent[] = [
			{ type: "paragraph", content: [{ type: "text", text: "Первый" }] },
			{ type: "paragraph" },
			{ type: "paragraph", content: [{ type: "text", text: "Второй" }] },
		];
		const originalLength = content.length;
		trimEndEmptyParagraphs(content);
		expect(content.length).toBe(originalLength);
		expect(content).toEqual([
			{ type: "paragraph", content: [{ type: "text", text: "Первый" }] },
			{ type: "paragraph" },
			{ type: "paragraph", content: [{ type: "text", text: "Второй" }] },
		]);
	});

	it("does not remove non-empty paragraphs after empty ones", () => {
		const content: JSONContent[] = [
			{ type: "paragraph", content: [{ type: "text", text: "Текст" }] },
			{ type: "paragraph" },
			{ type: "paragraph", content: [{ type: "text", text: "Еще текст" }] },
		];
		const originalLength = content.length;
		trimEndEmptyParagraphs(content);
		expect(content.length).toBe(originalLength);
		expect(content).toEqual([
			{ type: "paragraph", content: [{ type: "text", text: "Текст" }] },
			{ type: "paragraph" },
			{ type: "paragraph", content: [{ type: "text", text: "Еще текст" }] },
		]);
	});

	it("does not remove paragraphs with content", () => {
		const content: JSONContent[] = [
			{ type: "paragraph", content: [{ type: "text", text: "Текст" }] },
			{ type: "paragraph", content: [{ type: "text", text: "" }] },
		];
		trimEndEmptyParagraphs(content);
		expect(content.length).toBe(2);
		expect(content[0]).toEqual({ type: "paragraph", content: [{ type: "text", text: "Текст" }] });
		expect(content[1]).toEqual({ type: "paragraph", content: [{ type: "text", text: "" }] });
	});

	it("does not remove elements of other types", () => {
		const content: JSONContent[] = [
			{ type: "paragraph", content: [{ type: "text", text: "Текст" }] },
			{ type: "heading", attrs: { level: 1 } },
			{ type: "paragraph" },
		];
		trimEndEmptyParagraphs(content);
		expect(content).toEqual([
			{ type: "paragraph", content: [{ type: "text", text: "Текст" }] },
			{ type: "heading", attrs: { level: 1 } },
		]);
	});

	it("returns undefined for non-array", () => {
		const result1 = trimEndEmptyParagraphs(null as any);
		const result2 = trimEndEmptyParagraphs(undefined as any);
		const result3 = trimEndEmptyParagraphs({} as any);
		const result4 = trimEndEmptyParagraphs("string" as any);

		expect(result1).toBeUndefined();
		expect(result2).toBeUndefined();
		expect(result3).toBeUndefined();
		expect(result4).toBeUndefined();
	});

	it("prevents infinite loop with large number of empty paragraphs", () => {
		const content: JSONContent[] = Array(1000).fill({ type: "paragraph" });
		trimEndEmptyParagraphs(content);
		// Should remove at most as many elements as were initially present
		expect(content.length).toBe(0);
	});
});
