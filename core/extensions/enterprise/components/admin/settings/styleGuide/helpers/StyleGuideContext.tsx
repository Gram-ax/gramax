import type { StyleGuideRule } from "@ext/enterprise/components/admin/settings/styleGuide/helpers/StyleGuideRuleAdapter";
import { createContext, type ReactNode, useContext } from "react";
import type { StyleGuideSettings } from "../StyleGuideComponent";
import type { RuleExample } from "../types";

export interface StyleGuideDataContextValue {
	localSettings: StyleGuideSettings;
	checkSettings: StyleGuideSettings | null;
	setLocalSettings: React.Dispatch<React.SetStateAction<StyleGuideSettings>>;
	handleSave: (updatedSettings: StyleGuideSettings) => Promise<void>;
}

export interface StyleGuideUIContextValue {
	hasUnsavedChanges: boolean;
	setHasUnsavedChanges: (value: boolean) => void;
}

export interface StyleGuideTestContextValue {
	runningTests: Set<string>;
	isRunningAllTests: boolean;
	isAnyTestRunning: boolean;
	hasValidTests: () => boolean;
	runSingleTest: (rule: StyleGuideRule, testCase: RuleExample & { id: string }) => Promise<void>;
	runAllTestsForRule: (rule: StyleGuideRule) => Promise<void>;
	runAllTestsGlobal: () => Promise<void>;
	abortAllTests: () => void;
}

const StyleGuideDataContext = createContext<StyleGuideDataContextValue | null>(null);
const StyleGuideUIContext = createContext<StyleGuideUIContextValue | null>(null);
const StyleGuideTestContext = createContext<StyleGuideTestContextValue | null>(null);

export function useStyleGuideData() {
	const context = useContext(StyleGuideDataContext);
	if (!context) throw new Error("useStyleGuideData must be used within StyleGuideDataProvider");
	return context;
}

export function useStyleGuideUI() {
	const context = useContext(StyleGuideUIContext);
	if (!context) throw new Error("useStyleGuideUI must be used within StyleGuideUIProvider");
	return context;
}

export function useStyleGuideTests() {
	const context = useContext(StyleGuideTestContext);
	if (!context) throw new Error("useStyleGuideTests must be used within StyleGuideTestProvider");
	return context;
}

export function StyleGuideContextProviders({
	children,
	dataValue,
	uiValue,
	testValue,
}: {
	children: ReactNode;
	dataValue: StyleGuideDataContextValue;
	uiValue: StyleGuideUIContextValue;
	testValue: StyleGuideTestContextValue;
}) {
	return (
		<StyleGuideDataContext.Provider value={dataValue}>
			<StyleGuideUIContext.Provider value={uiValue}>
				<StyleGuideTestContext.Provider value={testValue}>{children}</StyleGuideTestContext.Provider>
			</StyleGuideUIContext.Provider>
		</StyleGuideDataContext.Provider>
	);
}
