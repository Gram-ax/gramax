import { useCallback } from "react";
import type { ForType, ForTypeObject, LgtRule, LlmRule } from "../StyleGuideComponent";
import { generateGuid, type StyleGuideSettings } from "../StyleGuideComponent";
import type { useActiveRule } from "./useActiveRule";

export const useRuleStorage = (
	activeRule: ReturnType<typeof useActiveRule>,
	localSettings: StyleGuideSettings,
	setLocalSettings: React.Dispatch<React.SetStateAction<StyleGuideSettings>>,
) => {
	const findRuleProvider = useCallback(
		(guid: string): "lgt" | "llm" | null => {
			if (localSettings.lgt.rules.some((r) => r.guid === guid)) return "lgt";
			if (localSettings.llm?.rules?.some((r) => r.guid === guid)) return "llm";
			return null;
		},
		[localSettings],
	);

	const updateRule = useCallback(
		(guid: string, updates: Partial<LgtRule | LlmRule>) => {
			const provider = findRuleProvider(guid);
			if (!provider) return;

			setLocalSettings((prev) => ({
				...prev,
				[provider]: {
					rules: (prev[provider]?.rules ?? []).map((rule) =>
						rule.guid === guid ? { ...rule, ...updates } : rule,
					),
				},
			}));
		},
		[findRuleProvider, setLocalSettings],
	);

	const addRule = useCallback(
		(provider: "lgt" | "llm") => {
			const newGuid = generateGuid();
			const templates = {
				lgt: {
					guid: newGuid,
					xml: '<rule id="" name="Новое правило"></rule>',
					forTypes: [] as ForTypeObject[],
					enabled: true,
					testCases: [],
				},
				llm: {
					guid: newGuid,
					name: "Новое правило",
					llmPrompt: "",
					enabled: true,
					testCases: [],
				},
			};

			setLocalSettings((prev) => {
				activeRule.activate(provider, newGuid);
				return {
					...prev,
					[provider]: { rules: [...(prev[provider]?.rules ?? []), templates[provider]] },
				};
			});
		},
		[activeRule, setLocalSettings],
	);

	const deleteRule = useCallback(
		(guid: string) => {
			if (!confirm("Вы уверены, что хотите удалить правило?")) return;

			const provider = findRuleProvider(guid);
			if (!provider) return;

			setLocalSettings((prev) => {
				const rules = prev[provider]?.rules ?? [];
				const newRules = rules.filter((r) => r.guid !== guid);

				if (provider === activeRule.activeProvider && activeRule.getSelectedGuid() === guid) {
					const currentIndex = rules.findIndex((r) => r.guid === guid);
					const newIndex = currentIndex > 0 ? currentIndex - 1 : 0;
					const newSelectedGuid = newRules[newIndex]?.guid ?? null;
					activeRule.setSelectedGuid(newSelectedGuid);
				}

				return { ...prev, [provider]: { rules: newRules } };
			});
		},
		[activeRule, findRuleProvider, setLocalSettings],
	);

	const updateForTypes = useCallback(
		(guid: string, options: { value: string }[]) => {
			updateRule(guid, {
				forTypes: options.length > 0 ? options.map((opt) => ({ code: opt.value as ForType })) : undefined,
			});
		},
		[updateRule],
	);

	return { updateRule, addRule, deleteRule, updateForTypes };
};
