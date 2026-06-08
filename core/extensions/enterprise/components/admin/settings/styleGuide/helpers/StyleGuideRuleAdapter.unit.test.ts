import { LgtRuleAdapter } from "@ext/enterprise/components/admin/settings/styleGuide/helpers/StyleGuideRuleAdapter";
import { describe, expect, it } from "@jest/globals";

describe("LgtRuleAdapter.getName", () => {
	it("should extract name from rule with name attribute", () => {
		const xml = `<rule name="Вопросительный знак в заголовках" description="Не пишем вопросительный знак в заголовках.">?</rule>`;
		const rule = {
			guid: "111111aaaaa",
			xml,
			forTypes: [],
			testCases: [],
		};
		const lgtRule = new LgtRuleAdapter(rule);
		expect(lgtRule.getName()).toBe("Вопросительный знак в заголовках");
	});

	it("should extract name from rule with single quotes", () => {
		const xml = `<rule name='Тавтология' description='Повтор слов'>text</rule>`;
		const rule = {
			guid: "222222bbbbb",
			xml,
			forTypes: [],
			testCases: [],
		};
		const lgtRule = new LgtRuleAdapter(rule);
		expect(lgtRule.getName()).toBe("Тавтология");
	});

	it("should extract name from rulegroup", () => {
		const xml = `<rulegroup name='Вопросительный знак в заголовках' id='test'>?</rulegroup>`;
		const rule = {
			guid: "333333ccccc",
			xml,
			forTypes: [],
			testCases: [],
		};
		const lgtRule = new LgtRuleAdapter(rule);
		expect(lgtRule.getName()).toBe("Вопросительный знак в заголовках");
	});

	it("should extract name when id comes before name", () => {
		const xml = `<rule id='test' name='Предложения с заглавной буквы'>text</rule>`;
		const rule = {
			guid: "444444ddddd",
			xml,
			forTypes: [],
			testCases: [],
		};
		const lgtRule = new LgtRuleAdapter(rule);
		expect(lgtRule.getName()).toBe("Предложения с заглавной буквы");
	});

	it("should return empty string when name is not found", () => {
		const xml = `<rule id='test' description='test'>text</rule>`;
		const rule = {
			guid: "555555eeeee",
			xml,
			forTypes: [],
			testCases: [],
		};
		const lgtRule = new LgtRuleAdapter(rule);
		expect(lgtRule.getName()).toBe("");
	});

	it("should return empty string for empty xml", () => {
		const rule = {
			guid: "666666fffff",
			xml: "",
			forTypes: [],
			testCases: [],
		};
		const lgtRule = new LgtRuleAdapter(rule);
		expect(lgtRule.getName()).toBe("");
	});

	it("should handle special regex characters in name", () => {
		const xml = `<rule name='Rule (with) [special] $chars?' description='test'>text</rule>`;
		const rule = {
			guid: "777777ggggg",
			xml,
			forTypes: [],
			testCases: [],
		};
		const lgtRule = new LgtRuleAdapter(rule);
		expect(lgtRule.getName()).toBe("Rule (with) [special] $chars?");
	});

	it("should extract name from rule with multiple attributes", () => {
		const xml = `<rule id='test' name='Тавтология' description='Повтор слов' type='style'>text</rule>`;
		const rule = {
			guid: "888888hhhhh",
			xml,
			forTypes: [],
			testCases: [],
		};
		const lgtRule = new LgtRuleAdapter(rule);
		expect(lgtRule.getName()).toBe("Тавтология");
	});
});
