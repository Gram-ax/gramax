/** biome-ignore-all lint/correctness/useExhaustiveDependencies: we don't want to use exhaustive dependencies here */

import {
	LgtRuleAdapter,
	LlmRuleAdapter,
	type StyleGuideRule,
} from "@ext/enterprise/components/admin/settings/styleGuide/helpers/StyleGuideRuleAdapter";
import { hasRelevantSuggestions } from "@ext/enterprise/components/admin/settings/styleGuide/utils/hasRelevantSuggestions";
import type {
	CheckChunk,
	CheckOverrideSettings,
	CheckSuggestion,
	StyleGuideCheckProvider,
} from "@ics/gx-vector-search";
import { useCallback, useRef } from "react";
import type { StyleGuideSettings } from "../StyleGuideComponent";
import type { LgtRule, LlmRule, RuleExample } from "../types";

type TestResult = {
	statusCode: "success" | "failed";
	result: { suggestions: CheckSuggestion[] };
	dateTimeIso8601: string;
};

export const computeStatusCode = (
	suggestions: CheckSuggestion[],
	ruleName: string,
	isCorrect: boolean,
): "success" | "failed" => {
	const hasRelevant = suggestions.some((s) => hasRelevantSuggestions(ruleName, s.text));
	return isCorrect ? (hasRelevant ? "failed" : "success") : hasRelevant ? "success" : "failed";
};

export const isHeadingRule = (rule: StyleGuideRule): boolean => {
	const model = rule.getModel();
	return model.forTypes.some((t) => t.code === "heading");
};

export const buildChunks = (
	testCases: (RuleExample & { id: string })[],
	rule: StyleGuideRule,
	startId = 1,
): { chunks: CheckChunk[]; chunkIdToTestId: Map<number, string> } => {
	const heading = isHeadingRule(rule);
	const chunks: CheckChunk[] = [];
	const chunkIdToTestId = new Map<number, string>();

	let chunkId = startId;
	for (const testCase of testCases) {
		if (!testCase.text) continue;
		chunks.push({
			id: chunkId,
			text: testCase.text,
			type: heading ? "heading" : "plainText",
		});
		chunkIdToTestId.set(chunkId, testCase.id);
		chunkId++;
	}

	return { chunks, chunkIdToTestId };
};

export const buildOverrideSettings = (rule: StyleGuideRule, systemPrompt: string): CheckOverrideSettings => {
	const model = rule.getModel();
	if (rule.provider === "lgt") {
		return { languageTool: { rules: [{ xmlString: (model as LgtRule).xml }] } };
	}
	return {
		llm: {
			systemPrompt: { text: systemPrompt },
			rules: [{ llmPrompt: (model as LlmRule).llmPrompt, name: (model as LlmRule).name }],
		},
	};
};

export const buildBatchOverrideSettings = (
	lgtRules: StyleGuideRule[],
	llmRules: StyleGuideRule[],
	systemPrompt: string,
): { settings: CheckOverrideSettings; providers: StyleGuideCheckProvider[] } => {
	const settings: CheckOverrideSettings = {};
	const providers: StyleGuideCheckProvider[] = [];

	if (lgtRules.length) {
		providers.push("languageTool");
		settings.languageTool = {
			rules: lgtRules.map((r) => ({ xmlString: (r.getModel() as LgtRule).xml })),
		};
	}

	if (llmRules.length) {
		providers.push("llm");
		settings.llm = {
			systemPrompt: { text: systemPrompt },
			rules: llmRules.map((r) => {
				const model = r.getModel() as LlmRule;
				return { llmPrompt: model.llmPrompt, name: model.name };
			}),
		};
	}

	return { settings, providers };
};

export const groupSuggestionsByChunkId = (suggestions: CheckSuggestion[]): Map<number, CheckSuggestion[]> => {
	const map = new Map<number, CheckSuggestion[]>();
	for (const suggestion of suggestions) {
		const existing = map.get(suggestion.id) ?? [];
		map.set(suggestion.id, [...existing, suggestion]);
	}
	return map;
};

export const buildTestResults = (
	suggestions: CheckSuggestion[],
	chunkIdToTestId: Map<number, string>,
	testCasesById: Map<string, RuleExample & { id: string }>,
	ruleName: string,
): Map<string, TestResult> => {
	const byChunkId = groupSuggestionsByChunkId(suggestions);
	const results = new Map<string, TestResult>();
	const now = new Date().toISOString();

	for (const [chunkId, testId] of chunkIdToTestId) {
		const testCase = testCasesById.get(testId);
		if (!testCase) continue;

		const chunkSuggestions = byChunkId.get(chunkId) ?? [];
		results.set(testId, {
			statusCode: computeStatusCode(chunkSuggestions, ruleName, testCase.isCorrect),
			result: { suggestions: chunkSuggestions },
			dateTimeIso8601: now,
		});
	}

	return results;
};

export const getProvider = (rule: StyleGuideRule): StyleGuideCheckProvider => {
	const provider = rule.provider;
	return provider === "llm" ? provider : "languageTool";
};

export const normalizeTestCases = (rule: StyleGuideRule): (RuleExample & { id: string })[] => {
	const model = rule.getModel();
	return (model.testCases ?? []).map((tc, index) => ({
		...tc,
		id: tc.id || `${model.guid}-${index}`,
	}));
};

export const buildGlobalTestBatch = (
	allRules: StyleGuideRule[],
	startChunkId = 1,
): {
	allChunks: CheckChunk[];
	chunkMetadata: Array<{ rule: StyleGuideRule; testId: string; globalChunkId: number }>;
} => {
	let chunkIdCounter = startChunkId;
	const allChunks: CheckChunk[] = [];
	const chunkMetadata: Array<{ rule: StyleGuideRule; testId: string; globalChunkId: number }> = [];

	for (const rule of allRules) {
		const testCases = normalizeTestCases(rule);
		const { chunks, chunkIdToTestId } = buildChunks(testCases, rule, chunkIdCounter);
		for (const chunk of chunks) {
			allChunks.push(chunk);
			chunkMetadata.push({
				rule,
				testId: chunkIdToTestId.get(chunk.id)!,
				globalChunkId: chunk.id,
			});
		}
		chunkIdCounter += chunks.length;
	}

	return { allChunks, chunkMetadata };
};

export const processGlobalTestResults = (
	suggestions: CheckSuggestion[],
	chunkMetadata: Array<{ rule: StyleGuideRule; testId: string; globalChunkId: number }>,
): Map<string, { rule: StyleGuideRule; results: Map<string, TestResult> }> => {
	const byChunkId = groupSuggestionsByChunkId(suggestions);
	const resultsByRule = new Map<string, { rule: StyleGuideRule; results: Map<string, TestResult> }>();
	const now = new Date().toISOString();

	for (const meta of chunkMetadata) {
		const model = meta.rule.getModel();
		const testCases = normalizeTestCases(meta.rule);
		const testCase = testCases.find((tc) => tc.id === meta.testId);
		if (!testCase) continue;

		const chunkSuggestions = byChunkId.get(meta.globalChunkId) ?? [];

		if (!resultsByRule.has(model.guid)) {
			resultsByRule.set(model.guid, { rule: meta.rule, results: new Map() });
		}

		resultsByRule.get(model.guid)!.results.set(meta.testId, {
			statusCode: computeStatusCode(chunkSuggestions, meta.rule.getName(), testCase.isCorrect),
			result: { suggestions: chunkSuggestions },
			dateTimeIso8601: now,
		});
	}

	return resultsByRule;
};

export const useTestManager = (
	localSettings: StyleGuideSettings,
	setLocalSettings: React.Dispatch<React.SetStateAction<StyleGuideSettings>>,
	checkStyleGuide: (
		chunks: CheckChunk[],
		providers: StyleGuideCheckProvider[],
		overrideSettings?: CheckOverrideSettings,
		checkSpelling?: boolean,
		signal?: AbortSignal,
	) => Promise<CheckSuggestion[]>,
	setRunningTests: React.Dispatch<React.SetStateAction<Set<string>>>,
	setIsRunningAllTests: React.Dispatch<React.SetStateAction<boolean>>,
) => {
	const abortControllerRef = useRef<AbortController | null>(null);

	const findRule = useCallback(
		(guid: string): StyleGuideRule | null => {
			const lgtRule = localSettings.lgt.rules.find((r) => r.guid === guid);
			if (lgtRule) return new LgtRuleAdapter(lgtRule);
			const llmRule = localSettings.llm?.rules?.find((r) => r.guid === guid);
			if (llmRule) return new LlmRuleAdapter(llmRule);
			return null;
		},
		[localSettings],
	);

	const updateTestResults = useCallback(
		(rule: StyleGuideRule, resultsMap: Map<string, TestResult>) => {
			const model = rule.getModel();

			setLocalSettings((current) => ({
				...current,
				[rule.provider]: {
					rules: current[rule.provider].rules.map((r) => {
						if (r.guid !== model.guid) return r;
						return {
							...r,
							testCases: r.testCases?.map((ex, idx) => {
								if (!ex.text) return ex;
								const testId = ex.id || `${r.guid}-${idx}`;
								const result = resultsMap.get(testId);
								return result ? { ...ex, runResult: result } : ex;
							}),
						};
					}),
				},
			}));
		},
		[setLocalSettings],
	);

	const addTestKeys = useCallback(
		(keys: string[]) => {
			setRunningTests((prev) => {
				const next = new Set(prev);
				for (const key of keys) next.add(key);
				return next;
			});
		},
		[setRunningTests],
	);

	const removeTestKeys = useCallback(
		(keys: string[]) => {
			setRunningTests((prev) => {
				const next = new Set(prev);
				for (const key of keys) next.delete(key);
				return next;
			});
		},
		[setRunningTests],
	);

	const withAbort = useCallback(
		async <T>(
			fn: (signal: AbortSignal) => Promise<T>,
			testKeys: string[],
			label: string,
		): Promise<T | undefined> => {
			addTestKeys(testKeys);
			const controller = new AbortController();
			abortControllerRef.current = controller;

			try {
				return await fn(controller.signal);
			} catch (error) {
				if (error instanceof Error && error.name === "AbortError") {
					console.log(`Aborted: ${label}`);
				} else {
					console.error(`Failed: ${label}`, error);
				}
				return undefined;
			} finally {
				removeTestKeys(testKeys);
				abortControllerRef.current = null;
			}
		},
		[addTestKeys, removeTestKeys],
	);

	const runSingleTest = useCallback(
		async (rule: StyleGuideRule, testCase: RuleExample & { id: string }) => {
			if (!rule) return;

			if (!testCase?.text) return;

			await withAbort(
				async (signal) => {
					const { chunks, chunkIdToTestId } = buildChunks([testCase], rule);
					const overrideSettings = buildOverrideSettings(rule, localSettings.systemPrompt.text);
					const providers: StyleGuideCheckProvider[] = [getProvider(rule)];

					const suggestions = await checkStyleGuide(chunks, providers, overrideSettings, false, signal);

					const testCasesById = new Map([[testCase.id, testCase]]);
					const results = buildTestResults(suggestions, chunkIdToTestId, testCasesById, rule.getName());
					updateTestResults(rule, results);
				},
				[`${rule.getModel().guid}-${testCase.id}`],
				`rule ${rule.getModel().guid}, test ${testCase.id}`,
			);
		},
		[checkStyleGuide, localSettings, findRule, updateTestResults, withAbort],
	);

	const runAllTestsForRule = useCallback(
		async (rule: StyleGuideRule) => {
			if (!rule) return;

			const testCases = normalizeTestCases(rule);

			if (!testCases.length) return;

			const testKeys = testCases.map((tc) => `${rule.getModel().guid}-${tc.id}`);

			await withAbort(
				async (signal) => {
					const { chunks, chunkIdToTestId } = buildChunks(testCases, rule);
					if (!chunks.length) return;

					const overrideSettings = buildOverrideSettings(rule, localSettings.systemPrompt.text);
					const providers: StyleGuideCheckProvider[] = [getProvider(rule)];

					const suggestions = await checkStyleGuide(chunks, providers, overrideSettings, false, signal);

					const testCasesById = new Map(testCases.map((tc) => [tc.id, tc]));
					const results = buildTestResults(suggestions, chunkIdToTestId, testCasesById, rule.getName());
					updateTestResults(rule, results);
				},
				testKeys,
				`rule ${rule.getModel().guid}`,
			);
		},
		[checkStyleGuide, localSettings, findRule, updateTestResults, withAbort],
	);

	const runAllTestsGlobal = useCallback(async () => {
		const lgtRules = localSettings.lgt.rules
			.filter((r) => (r.enabled ?? true) && r.testCases?.length)
			.map((r) => new LgtRuleAdapter(r));
		const llmRules = (localSettings.llm?.rules ?? [])
			.filter((r) => (r.enabled ?? true) && r.testCases?.length)
			.map((r) => new LlmRuleAdapter(r));

		if (!lgtRules.length && !llmRules.length) return;

		const allRules: StyleGuideRule[] = [...lgtRules, ...llmRules];

		const allTestKeys: string[] = [];
		for (const rule of allRules) {
			const model = rule.getModel();
			const testCases = normalizeTestCases(rule);
			allTestKeys.push(...testCases.map((tc) => `${model.guid}-${tc.id}`));
		}

		setIsRunningAllTests(true);

		try {
			await withAbort(
				async (signal) => {
					const { allChunks, chunkMetadata } = buildGlobalTestBatch(allRules);

					if (!allChunks.length) return;

					const { settings, providers } = buildBatchOverrideSettings(
						lgtRules,
						llmRules,
						localSettings.systemPrompt.text,
					);
					const suggestions = await checkStyleGuide(allChunks, providers, settings, false, signal);

					const resultsByRule = processGlobalTestResults(suggestions, chunkMetadata);

					for (const [_, { rule, results }] of resultsByRule) {
						updateTestResults(rule, results);
					}
				},
				allTestKeys,
				"all global tests",
			);
		} finally {
			setIsRunningAllTests(false);
		}
	}, [checkStyleGuide, localSettings, setIsRunningAllTests, updateTestResults, withAbort]);

	const abortAllTests = useCallback(() => {
		abortControllerRef.current?.abort();
	}, []);

	return {
		runSingleTest,
		runAllTestsForRule,
		runAllTestsGlobal,
		abortAllTests,
	};
};
