import astToParagraphs from "@ext/StyleGuide/logic/astToParagraphs";
import { describe, expect, it } from "@jest/globals";

describe("astToParagraphs", () => {
	it("should parse AST to paragraphs", () => {
		const astObject = {
			type: "doc",
			content: [
				{
					type: "heading",
					content: [
						{
							type: "text",
							text: "Демо-версия и демо-модуль…",
						},
					],
				},
				{
					type: "paragraph",
					content: [
						{
							type: "text",
							text: "2. Список с нумерованным элементом. Второе предложение списка.",
						},
					],
				},
				{
					type: "paragraph",
				},
				{
					type: "paragraph",
				},
				{
					type: "paragraph",
					content: [
						{
							type: "text",
							text: "Демо-стенд. Новое предложение параграфа",
						},
					],
				},
			],
		};

		expect(astToParagraphs(astObject)).toEqual([
			{ id: 0, text: "Демо-версия и демо-модуль…", type: "heading" },
			{ id: 1, text: "2. Список с нумерованным элементом.", type: "plainText" },
			{ id: 2, text: "Второе предложение списка.", type: "plainText" },
			{ id: 3, text: "Демо-стенд.", type: "plainText" },
			{ id: 4, text: "Новое предложение параграфа", type: "plainText" },
		]);
	});
});
