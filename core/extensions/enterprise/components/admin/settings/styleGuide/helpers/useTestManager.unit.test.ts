import {
	LgtRuleAdapter,
	LlmRuleAdapter,
} from "@ext/enterprise/components/admin/settings/styleGuide/helpers/StyleGuideRuleAdapter";
import type { CheckSuggestion } from "@ics/gx-vector-search";
import { describe, expect, it } from "@jest/globals";
import {
	buildBatchOverrideSettings,
	buildChunks,
	buildGlobalTestBatch,
	buildOverrideSettings,
	buildTestResults,
	computeStatusCode,
	getProvider,
	groupSuggestionsByChunkId,
	isHeadingRule,
	normalizeTestCases,
	processGlobalTestResults,
} from "./useTestManager";

describe("computeStatusCode", () => {
	it("should return success when correct text has no relevant suggestions", () => {
		const suggestions: CheckSuggestion[] = [{ id: 1, text: "<suggestion name='other'>text</suggestion>" }];
		expect(computeStatusCode(suggestions, "MyRule", true)).toBe("success");
	});
});

describe("isHeadingRule", () => {
	it("should return true when rule has heading type", () => {
		const rule = new LgtRuleAdapter({
			guid: "test",
			xml: "<rule name='test'></rule>",
			forTypes: [{ code: "heading" }],
			testCases: [],
		});
		expect(isHeadingRule(rule)).toBe(true);
	});
});

describe("buildChunks", () => {
	it("should build chunks with sequential IDs starting from startId", () => {
		const rule = new LgtRuleAdapter({
			guid: "test",
			xml: "<rule name='test'></rule>",
			forTypes: [],
			testCases: [],
		});
		const testCases = [
			{ id: "t1", text: "text1", isCorrect: true },
			{ id: "t2", text: "text2", isCorrect: false },
		];
		const { chunks, chunkIdToTestId } = buildChunks(testCases, rule, 10);
		expect(chunks).toEqual([
			{ id: 10, text: "text1", type: "plainText" },
			{ id: 11, text: "text2", type: "plainText" },
		]);
		expect(chunkIdToTestId).toEqual(
			new Map([
				[10, "t1"],
				[11, "t2"],
			]),
		);
	});
});

describe("buildOverrideSettings", () => {
	it("should return languageTool settings for lgt rule", () => {
		const rule = new LgtRuleAdapter({
			guid: "test",
			xml: "<rule name='test'></rule>",
			forTypes: [],
			testCases: [],
		});
		const result = buildOverrideSettings(rule, "prompt");
		expect(result).toEqual({
			languageTool: {
				rules: [
					{
						xmlString: "<rule name='test'></rule>",
					},
				],
			},
		});
	});

	it("should return llm settings for llm rule", () => {
		const rule = new LlmRuleAdapter({
			guid: "test",
			name: "test",
			llmPrompt: "prompt",
			forTypes: [],
			testCases: [],
		});
		const result = buildOverrideSettings(rule, "prompt");
		expect(result).toEqual({
			llm: {
				rules: [
					{
						llmPrompt: "prompt",
						name: "test",
					},
				],
				systemPrompt: {
					text: "prompt",
				},
			},
		});
	});
});

describe("buildBatchOverrideSettings", () => {
	it("should include both providers when both rule types present", () => {
		const lgtRule = new LgtRuleAdapter({
			guid: "lgt1",
			xml: "<rule name='lgt'></rule>",
			forTypes: [],
			testCases: [],
		});
		const llmRule = new LlmRuleAdapter({
			guid: "llm1",
			name: "llm",
			llmPrompt: "prompt",
			forTypes: [],
			testCases: [],
		});
		const { settings, providers } = buildBatchOverrideSettings([lgtRule], [llmRule], "system");
		expect(providers).toEqual(["languageTool", "llm"]);
		expect(settings).toEqual({
			languageTool: { rules: [{ xmlString: "<rule name='lgt'></rule>" }] },
			llm: { rules: [{ llmPrompt: "prompt", name: "llm" }], systemPrompt: { text: "system" } },
		});
	});
});

describe("groupSuggestionsByChunkId", () => {
	it("should group suggestions by chunk id", () => {
		const suggestions: CheckSuggestion[] = [
			{ id: 1, text: "s1" },
			{ id: 1, text: "s2" },
			{ id: 2, text: "s3" },
		];
		const result = groupSuggestionsByChunkId(suggestions);
		expect(result.get(1)).toHaveLength(2);
		expect(result.get(2)).toHaveLength(1);
	});
});

describe("buildTestResults", () => {
	it("should build test results map from suggestions", () => {
		const suggestions: CheckSuggestion[] = [{ id: 1, text: "<suggestion name='Rule'>text</suggestion>" }];
		const chunkIdToTestId = new Map([[1, "t1"]]);
		const testCasesById = new Map([["t1", { id: "t1", text: "test", isCorrect: false }]]);
		const results = buildTestResults(suggestions, chunkIdToTestId, testCasesById, "Rule");
		expect(results.get("t1")?.statusCode).toBe("success");
	});
});

describe("getProvider", () => {
	it("should return llm for llm rule", () => {
		const rule = new LlmRuleAdapter({
			guid: "test",
			name: "test",
			llmPrompt: "prompt",
			forTypes: [],
			testCases: [],
		});
		expect(getProvider(rule)).toBe("llm");
	});
});

describe("normalizeTestCases", () => {
	it("should generate IDs for test cases without ID", () => {
		const rule = new LgtRuleAdapter({
			guid: "guid1",
			xml: "<rule name='test'></rule>",
			forTypes: [],
			testCases: [{ text: "test", isCorrect: true }],
		});
		const result = normalizeTestCases(rule);
		expect(result[0].id).toBe("guid1-0");
	});
});

describe("buildGlobalTestBatch", () => {
	it("should build batch with continuous chunk IDs across rules", () => {
		const rule1 = new LgtRuleAdapter({
			guid: "r1",
			xml: "<rule name='r1'></rule>",
			forTypes: [],
			testCases: [
				{ id: "t1", text: "text1", isCorrect: true },
				{ id: "t2", text: "text2", isCorrect: true },
			],
		});
		const rule2 = new LgtRuleAdapter({
			guid: "r2",
			xml: "<rule name='r2'></rule>",
			forTypes: [],
			testCases: [{ id: "t3", text: "text3", isCorrect: true }],
		});
		const { allChunks, chunkMetadata } = buildGlobalTestBatch([rule1, rule2], 100);
		expect(allChunks).toEqual([
			{ id: 100, text: "text1", type: "plainText" },
			{ id: 101, text: "text2", type: "plainText" },
			{ id: 102, text: "text3", type: "plainText" },
		]);
		expect(chunkMetadata).toEqual([
			{
				globalChunkId: 100,
				rule: rule1,
				testId: "t1",
			},
			{
				globalChunkId: 101,
				rule: rule1,
				testId: "t2",
			},
			{
				globalChunkId: 102,
				rule: rule2,
				testId: "t3",
			},
		]);
	});
});

describe("processGlobalTestResults", () => {
	it("should group results by rule guid", () => {
		const rule = new LgtRuleAdapter({
			guid: "r1",
			xml: "<rule name='Rule'></rule>",
			forTypes: [],
			testCases: [
				{ id: "t1", text: "text1", isCorrect: false },
				{ id: "t2", text: "text2", isCorrect: true },
			],
		});
		const suggestions: CheckSuggestion[] = [{ id: 1, text: "<suggestion name='Rule'>text</suggestion>" }];
		const chunkMetadata = [
			{ rule, testId: "t1", globalChunkId: 1 },
			{ rule, testId: "t2", globalChunkId: 2 },
		];
		const results = processGlobalTestResults(suggestions, chunkMetadata);
		const r1 = results.get("r1");
		const normalizedR1 = Object.fromEntries(
			[...r1.results.entries()].map(([k, v]) => [
				k,
				{
					statusCode: v.statusCode,
					suggestions: v.result.suggestions,
				},
			]),
		);

		expect(normalizedR1).toEqual({
			t1: {
				statusCode: "success",
				suggestions: [{ id: 1, text: "<suggestion name='Rule'>text</suggestion>" }],
			},
			t2: {
				statusCode: "success",
				suggestions: [],
			},
		});
	});
});
