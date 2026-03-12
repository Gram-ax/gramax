import type { useActiveRule } from "../hooks/useActiveRule";
import type { useTestManager } from "../hooks/useTestManager";
import type { useRuleStorage } from "./useRuleStorage";

export const createHandlers = (
	activeRule: ReturnType<typeof useActiveRule>,
	ruleManager: ReturnType<typeof useRuleStorage>,
	testManager: ReturnType<typeof useTestManager>,
) => ({
	rule: {
		add: {
			lgt: () => ruleManager.addRule("lgt"),
			llm: () => ruleManager.addRule("llm"),
		},
		delete: () => {
			const guid = activeRule.getSelectedGuid();
			if (guid) ruleManager.deleteRule(guid);
		},
		toggle: (checked: boolean) => {
			const guid = activeRule.getSelectedGuid();
			if (guid) ruleManager.updateRule(guid, { enabled: checked });
		},
		updateXml: (xml?: string) => {
			if (xml && activeRule.selectedLgtGuid) {
				ruleManager.updateRule(activeRule.selectedLgtGuid, { xml });
			}
		},
		updateName: (name: string) => {
			if (activeRule.selectedLlmGuid) {
				ruleManager.updateRule(activeRule.selectedLlmGuid, { name });
			}
		},
		updatePrompt: (e: React.ChangeEvent<HTMLTextAreaElement>) => {
			if (activeRule.selectedLlmGuid) {
				ruleManager.updateRule(activeRule.selectedLlmGuid, { llmPrompt: e.target.value });
			}
		},
		updateTypes: (options) => {
			const guid = activeRule.getSelectedGuid();
			if (guid) ruleManager.updateForTypes(guid, options);
		},
	},
	test: {
		add: (isCorrect: boolean) => {
			const guid = activeRule.getSelectedGuid();
			if (guid) testManager.addTestCase(guid, isCorrect);
		},
		update: (idx: number, text: string) => {
			const guid = activeRule.getSelectedGuid();
			if (guid) testManager.updateTestCase(guid, idx, { text });
		},
		delete: (idx: number) => {
			const guid = activeRule.getSelectedGuid();
			if (guid) testManager.deleteTestCase(guid, idx);
		},
		run: (idx: number) => {
			const guid = activeRule.getSelectedGuid();
			if (guid) testManager.runSingleTest(guid, idx);
		},
		runAllForRule: () => {
			const guid = activeRule.getSelectedGuid();
			if (guid) testManager.runAllTestsForRule(guid);
		},
		runAllGlobal: () => testManager.runAllTestsGlobal(),
		abort: () => testManager.abortAllTests(),
	},
});
