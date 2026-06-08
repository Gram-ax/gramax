import { describe, expect, it } from "@jest/globals";
import { hasRelevantSuggestions } from "./hasRelevantSuggestions";

describe("hasRelevantSuggestions", () => {
	it("should match rule name in name attribute with double quotes", () => {
		const ruleName = "Вопросительный знак в заголовках";
		const text = `<suggestion name="Вопросительный знак в заголовках" description="Не пишем вопросительный знак в заголовках.">?</suggestion>`;

		expect(hasRelevantSuggestions(ruleName, text)).toBe(true);
	});

	it("should match rule name in name attribute with single quotes", () => {
		const ruleName = "Тавтология";
		const text = `<suggestion name='Тавтология' description='Повтор слов'>text</suggestion>`;

		expect(hasRelevantSuggestions(ruleName, text)).toBe(true);
	});

	it("should match rule name in name attribute with fancy quotes", () => {
		const ruleName = "Вопросительный знак в заголовках";
		const text = `<suggestion name='Вопросительный знак в заголовках' description='test'>?</suggestion>`;

		expect(hasRelevantSuggestions(ruleName, text)).toBe(true);
	});

	it("should match rule name in numbered name attribute (name2, name3, etc)", () => {
		const ruleName = "Предложения с заглавной буквы";
		const text = `<suggestion name='Тавтология' name2='Предложения с заглавной буквы'>text</suggestion>`;

		expect(hasRelevantSuggestions(ruleName, text)).toBe(true);
	});

	it("should return false when rule name is not found", () => {
		const ruleName = "Несуществующее правило";
		const text = `<suggestion name='Тавтология' description='test'>text</suggestion>`;

		expect(hasRelevantSuggestions(ruleName, text)).toBe(false);
	});

	it("should return false for empty text", () => {
		const ruleName = "Тавтология";
		const text = "";

		expect(hasRelevantSuggestions(ruleName, text)).toBe(false);
	});

	it("should handle special regex characters in rule name", () => {
		const ruleName = "Rule (with) [special] $chars?";
		const text = `<suggestion name='Rule (with) [special] $chars?' description='test'>text</suggestion>`;

		expect(hasRelevantSuggestions(ruleName, text)).toBe(true);
	});

	it("should not match partial rule name", () => {
		const ruleName = "Вопросительный знак";
		const text = `<suggestion name='Вопросительный знак в заголовках'>text</suggestion>`;

		expect(hasRelevantSuggestions(ruleName, text)).toBe(false);
	});
});
