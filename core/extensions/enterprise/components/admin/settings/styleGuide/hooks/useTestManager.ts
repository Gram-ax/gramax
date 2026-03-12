/** biome-ignore-all lint/correctness/useExhaustiveDependencies: we don't want to use exhaustive dependencies here */
import { getTitle } from "@ext/enterprise/components/admin/settings/styleGuide/components/StyleGuideEditor";
import { DEFAULT_SYSTEM_PROMPT } from "@ext/enterprise/components/admin/settings/styleGuide/components/StyleGuidePromptModal";
import type {
	CheckChunk,
	CheckOverrideSettings,
	CheckSuggestion,
	StyleGuideCheckProvider,
} from "@ics/gx-vector-search";
import { useCallback, useRef } from "react";
import type { LgtRule, LlmRule, RuleExample, StyleGuideSettings } from "../StyleGuideComponent";

function hasRelevantSuggestions(ruleName: string, text: string): boolean {
	const escapedRuleName = ruleName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

	const nameRegex = new RegExp(`name\\d*=['"'"]${escapedRuleName}['"'"]`, "g"); //sometimes responses come with different types of quotes

	return nameRegex.test(text);
}

export const useTestManager = (
	localSettings: StyleGuideSettings,
	setLocalSettings: React.Dispatch<React.SetStateAction<StyleGuideSettings>>,
	// biome-ignore lint/suspicious/noExplicitAny: it's a function from the context
	checkStyleGuide: any,
	setRunningTests: React.Dispatch<React.SetStateAction<Set<string>>>,
	setIsRunningAllTests: React.Dispatch<React.SetStateAction<boolean>>,
) => {
	const abortControllerRef = useRef<AbortController | null>(null);

	const findRuleProvider = useCallback(
		(guid: string): "lgt" | "llm" | null => {
			if (localSettings.lgt.rules.some((r) => r.guid === guid)) return "lgt";
			if (localSettings.llm?.rules?.some((r) => r.guid === guid)) return "llm";
			return null;
		},
		[localSettings],
	);

	const computeStatusCode = (
		suggestions: CheckSuggestion[],
		ruleName: string,
		isCorrect: boolean,
	): "success" | "failed" => {
		const hasRelevant = suggestions.some((s) => hasRelevantSuggestions(ruleName, s.text));
		if (isCorrect) {
			return hasRelevant ? "failed" : "success";
		}
		return hasRelevant ? "success" : "failed";
	};

	const updateTestCase = useCallback(
		(ruleGuid: string, testIndex: number, updates: Partial<RuleExample>) => {
			const provider = findRuleProvider(ruleGuid);
			if (!provider) return;

			setLocalSettings((prev) => ({
				...prev,
				[provider]: {
					rules: (prev[provider]?.rules ?? []).map((rule) =>
						rule.guid === ruleGuid
							? {
									...rule,
									testCases: (rule.testCases ?? []).map((tc, i) =>
										i === testIndex ? { ...tc, ...updates } : tc,
									),
								}
							: rule,
					),
				},
			}));
		},
		[findRuleProvider, setLocalSettings],
	);

	const addTestCase = useCallback(
		(ruleGuid: string, isCorrect: boolean) => {
			const provider = findRuleProvider(ruleGuid);
			if (!provider) return;

			setLocalSettings((prev) => ({
				...prev,
				[provider]: {
					rules: (prev[provider]?.rules ?? []).map((rule) =>
						rule.guid === ruleGuid
							? { ...rule, testCases: [...(rule.testCases ?? []), { isCorrect, text: "" }] }
							: rule,
					),
				},
			}));
		},
		[findRuleProvider, setLocalSettings],
	);

	const deleteTestCase = useCallback(
		(ruleGuid: string, testIndex: number) => {
			const provider = findRuleProvider(ruleGuid);
			if (!provider) return;

			setLocalSettings((prev) => ({
				...prev,
				[provider]: {
					rules: (prev[provider]?.rules ?? []).map((rule) =>
						rule.guid === ruleGuid
							? { ...rule, testCases: (rule.testCases ?? []).filter((_, i) => i !== testIndex) }
							: rule,
					),
				},
			}));
		},
		[findRuleProvider, setLocalSettings],
	);

	const runSingleTest = useCallback(
		async (ruleGuid: string, testIndex: number) => {
			const provider = findRuleProvider(ruleGuid);
			if (!provider) return;

			const testKey = `${ruleGuid}-${testIndex}`;
			setRunningTests((prev) => new Set(prev).add(testKey));

			const controller = new AbortController();
			abortControllerRef.current = controller;

			try {
				const rules = provider === "lgt" ? localSettings.lgt.rules : (localSettings.llm?.rules ?? []);
				const rule = rules.find((r) => r.guid === ruleGuid);
				const example = rule?.testCases?.[testIndex];
				if (!example?.text || !rule) return;

				const isHeading = (rule.forTypes ?? []).some((t) => t.code === "heading");

				const chunk: CheckChunk = {
					id: 1,
					text: example.text,
					type: isHeading ? "heading" : "plainText",
				};

				const overrideSettings: CheckOverrideSettings =
					provider === "lgt"
						? { languageTool: { rules: [{ xmlString: (rule as LgtRule).xml }] } }
						: {
								llm: {
									systemPrompt: localSettings.systemPrompt ?? { text: DEFAULT_SYSTEM_PROMPT },
									rules: [{ llmPrompt: (rule as LlmRule).llmPrompt, name: (rule as LlmRule).name }],
								},
							};

				const suggestions = await checkStyleGuide(
					[chunk],
					provider === "lgt" ? ["languageTool"] : ["llm"],
					overrideSettings,
					false,
					controller.signal,
				);

				const ruleName = provider === "lgt" ? getTitle((rule as LgtRule).xml) : (rule as LlmRule).name;
				const statusCode = computeStatusCode(suggestions, ruleName, example.isCorrect);

				setLocalSettings((current) => ({
					...current,
					[provider]: {
						rules: current[provider].rules.map((r) => {
							if (r.guid !== ruleGuid) return r;

							return {
								...r,
								testCases: r.testCases?.map((ex, idx) => {
									if (idx !== testIndex || !ex.text) return ex;

									return {
										...ex,
										runResult: {
											statusCode,
											result: { suggestions: suggestions },
											dateTimeIso8601: new Date().toISOString(),
										},
									};
								}),
							};
						}),
					},
				}));
			} catch (error) {
				if (error instanceof Error && error.name === "AbortError") {
					console.log(`Test aborted for rule ${ruleGuid}, test ${testIndex}`);
				} else {
					console.error(`Failed to run test for rule ${ruleGuid}`, error);
				}
			} finally {
				setRunningTests((prev) => {
					const next = new Set(prev);
					next.delete(testKey);
					return next;
				});
				abortControllerRef.current = null;
			}
		},
		[checkStyleGuide, localSettings, setLocalSettings, findRuleProvider, setRunningTests],
	);

	const runAllTestsForRule = useCallback(
		async (ruleGuid: string) => {
			const provider = findRuleProvider(ruleGuid);
			if (!provider) return;

			const rules = provider === "lgt" ? localSettings.lgt.rules : (localSettings.llm?.rules ?? []);
			const rule = rules.find((r) => r.guid === ruleGuid);
			if (!rule?.testCases?.length) return;

			const ruleName = provider === "lgt" ? getTitle((rule as LgtRule).xml) : (rule as LlmRule).name;

			const isHeading = (rule.forTypes ?? []).some((t) => t.code === "heading");

			const testKeys = rule.testCases
				.map((tc, idx) => (tc.text ? `${ruleGuid}-${idx}` : null))
				.filter((key): key is string => key !== null);

			setRunningTests((prev) => {
				const next = new Set(prev);
				testKeys.forEach((key) => next.add(key));
				return next;
			});

			const controller = new AbortController();
			abortControllerRef.current = controller;

			try {
				const chunks = rule.testCases
					.filter((tc) => tc.text)
					.map((tc, index) => ({
						id: index + 1,
						text: tc.text,
						type: isHeading ? ("heading" as const) : ("plainText" as const),
					}));

				if (!chunks.length) return;

				const overrideSettings: CheckOverrideSettings =
					provider === "lgt"
						? { languageTool: { rules: [{ xmlString: (rule as LgtRule).xml }] } }
						: {
								llm: {
									systemPrompt: localSettings.systemPrompt ?? { text: DEFAULT_SYSTEM_PROMPT },
									rules: [{ llmPrompt: (rule as LlmRule).llmPrompt, name: (rule as LlmRule).name }],
								},
							};

				const suggestions = await checkStyleGuide(
					chunks,
					provider === "lgt" ? ["languageTool"] : ["llm"],
					overrideSettings,
					false,
					controller.signal,
				);

				const suggestionsByChunkId = new Map<number, typeof suggestions>();

				for (const suggestion of suggestions) {
					const existing = suggestionsByChunkId.get(suggestion.id) ?? [];
					suggestionsByChunkId.set(suggestion.id, [...existing, suggestion]);
				}

				setLocalSettings((current) => ({
					...current,
					[provider]: {
						rules: current[provider].rules.map((r) => {
							if (r.guid !== ruleGuid) return r;

							return {
								...r,
								testCases: r.testCases?.map((ex, idx) => {
									if (!ex.text) return ex;

									const chunkId = idx + 1;
									const chunkSuggestions = suggestionsByChunkId.get(chunkId) ?? [];

									const statusCode = computeStatusCode(
										suggestions.filter((s) => s.id === chunkId),
										ruleName,
										ex.isCorrect,
									);

									return {
										...ex,
										runResult: {
											statusCode,
											result: { suggestions: chunkSuggestions },
											dateTimeIso8601: new Date().toISOString(),
										},
									};
								}),
							};
						}),
					},
				}));
			} catch (error) {
				if (error instanceof Error && error.name === "AbortError") {
					console.log(`Tests aborted for rule ${ruleGuid}`);
				} else {
					console.error(`Failed to run all tests for rule ${ruleGuid}`, error);
				}
			} finally {
				setRunningTests((prev) => {
					const next = new Set(prev);
					testKeys.forEach((key) => next.delete(key));
					return next;
				});
				abortControllerRef.current = null;
			}
		},
		[checkStyleGuide, localSettings, findRuleProvider, setLocalSettings, setRunningTests],
	);

	const runAllTestsGlobal = useCallback(async () => {
		const lgtRules = localSettings.lgt.rules.filter((r) => (r.enabled ?? true) && r.testCases?.length);
		const llmRules = (localSettings.llm?.rules ?? []).filter((r) => (r.enabled ?? true) && r.testCases?.length);

		if (!lgtRules.length && !llmRules.length) return;

		const allTestKeys: string[] = [];
		for (const rule of lgtRules) {
			rule.testCases?.forEach((tc, idx) => {
				if (tc.text) allTestKeys.push(`${rule.guid}-${idx}`);
			});
		}
		for (const rule of llmRules) {
			rule.testCases?.forEach((tc, idx) => {
				if (tc.text) allTestKeys.push(`${rule.guid}-${idx}`);
			});
		}

		setRunningTests((prev) => {
			const next = new Set(prev);
			allTestKeys.forEach((key) => next.add(key));
			return next;
		});
		setIsRunningAllTests(true);

		const controller = new AbortController();
		abortControllerRef.current = controller;

		try {
			let chunkIdCounter = 1;
			const allChunks: Array<{ id: number; text: string; type?: "plainText" | "heading" }> = [];

			const chunkIdToRuleName = new Map<number, string>();
			const chunkIdToIsCorrect = new Map<number, boolean>();

			for (const rule of lgtRules) {
				const isHeading = (rule.forTypes ?? []).some((t) => t.code === "heading");
				const ruleName = getTitle(rule.xml);

				rule.testCases?.forEach((tc) => {
					if (!tc.text) return;
					const currentChunkId = chunkIdCounter++;
					chunkIdToRuleName.set(currentChunkId, ruleName);
					chunkIdToIsCorrect.set(currentChunkId, tc.isCorrect);
					allChunks.push({
						id: currentChunkId,
						text: tc.text,
						type: isHeading ? "heading" : "plainText",
					});
				});
			}

			for (const rule of llmRules) {
				const isHeading = (rule.forTypes ?? []).some((t) => t.code === "heading");
				const ruleName = rule.name;

				rule.testCases?.forEach((tc) => {
					if (!tc.text) return;
					const currentChunkId = chunkIdCounter++;
					chunkIdToRuleName.set(currentChunkId, ruleName);
					chunkIdToIsCorrect.set(currentChunkId, tc.isCorrect);
					allChunks.push({
						id: currentChunkId,
						text: tc.text,
						type: isHeading ? "heading" : "plainText",
					});
				});
			}

			if (!allChunks.length) return;

			const overrideSettings: CheckOverrideSettings = {};
			const providers: StyleGuideCheckProvider[] = [];

			if (lgtRules.length) {
				providers.push("languageTool");
				overrideSettings.languageTool = {
					rules: lgtRules.map((r) => ({ xmlString: r.xml })),
				};
			}

			if (llmRules.length) {
				providers.push("llm");
				overrideSettings.llm = {
					systemPrompt: localSettings.systemPrompt ?? { text: DEFAULT_SYSTEM_PROMPT },
					rules: llmRules.map((r) => ({ llmPrompt: r.llmPrompt, name: r.name })),
				};
			}

			const suggestions = await checkStyleGuide(allChunks, providers, overrideSettings, false, controller.signal);

			const suggestionsByChunkId = new Map<number, typeof suggestions>();

			for (const suggestion of suggestions) {
				const existing = suggestionsByChunkId.get(suggestion.id) ?? [];
				suggestionsByChunkId.set(suggestion.id, [...existing, suggestion]);
			}

			setLocalSettings((current) => {
				const updated = { ...current };
				let currentChunkId = 1;

				updated.lgt.rules = updated.lgt.rules.map((rule) => {
					if (!rule.testCases?.length || !(rule.enabled ?? true)) return rule;

					const ruleName = getTitle(rule.xml);

					return {
						...rule,
						testCases: rule.testCases.map((ex) => {
							if (!ex.text) return ex;

							const chunkSuggestions = suggestionsByChunkId.get(currentChunkId) ?? [];
							const statusCode = computeStatusCode(
								suggestions.filter((s) => s.id === currentChunkId),
								ruleName,
								ex.isCorrect,
							);
							currentChunkId++;

							return {
								...ex,
								runResult: {
									statusCode, // ← вычисленный один раз
									result: { suggestions: chunkSuggestions },
									dateTimeIso8601: new Date().toISOString(),
								},
							};
						}),
					};
				});

				if (updated.llm) {
					updated.llm.rules = updated.llm.rules.map((rule) => {
						if (!rule.testCases?.length || !(rule.enabled ?? true)) return rule;

						return {
							...rule,
							testCases: rule.testCases.map((ex) => {
								if (!ex.text) return ex;

								const chunkSuggestions = suggestionsByChunkId.get(currentChunkId) ?? [];
								const statusCode = computeStatusCode(
									suggestions.filter((s) => s.id === currentChunkId),
									rule.name,
									ex.isCorrect,
								);
								currentChunkId++;

								return {
									...ex,
									runResult: {
										statusCode,
										result: { suggestions: chunkSuggestions },
										dateTimeIso8601: new Date().toISOString(),
									},
								};
							}),
						};
					});
				}

				return updated;
			});
		} catch (error) {
			if (error instanceof Error && error.name === "AbortError") {
				console.log("All tests aborted");
			} else {
				console.error("Failed to run all global tests", error);
			}
		} finally {
			setRunningTests((prev) => {
				const next = new Set(prev);
				allTestKeys.forEach((key) => next.delete(key));
				return next;
			});
			setIsRunningAllTests(false);
			abortControllerRef.current = null;
		}
	}, [checkStyleGuide, localSettings, setLocalSettings, setRunningTests, setIsRunningAllTests]);

	const abortAllTests = useCallback(() => {
		if (abortControllerRef.current) {
			abortControllerRef.current.abort();
		}
	}, []);

	return {
		addTestCase,
		updateTestCase,
		deleteTestCase,
		runSingleTest,
		runAllTestsForRule,
		runAllTestsGlobal,
		abortAllTests,
	};
};
