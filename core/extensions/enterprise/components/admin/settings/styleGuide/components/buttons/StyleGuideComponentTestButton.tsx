import { useStyleGuideTests } from "@ext/enterprise/components/admin/settings/styleGuide/helpers/StyleGuideContext";
import type { StyleGuideRule } from "@ext/enterprise/components/admin/settings/styleGuide/helpers/StyleGuideRuleAdapter";
import { Button } from "@ext/enterprise/components/admin/ui-kit/Button";
import t from "@ext/localization/locale/translate";
import { Ban, LoaderCircle, Play } from "lucide-react";

export interface StyleGuideTestManager {
	isAnyTestRunning: boolean;
	hasValidTests: boolean;
	abortAllTests: () => void;
	runAllTestsGlobal: () => void;
}

type BaseProps = { isUiLocked: boolean };

type PropsWithRule = BaseProps & {
	rule: StyleGuideRule;
};

type PropsWithManager = BaseProps & {
	testManager: StyleGuideTestManager;
};

export const StyleGuideRuleTestButton = ({ isUiLocked, rule }: PropsWithRule) => {
	const { isAnyTestRunning, hasValidTests, runAllTestsForRule } = useStyleGuideTests();

	return (
		<Button
			className="pl-2.5"
			disabled={isUiLocked || isAnyTestRunning || !hasValidTests}
			onClick={() => runAllTestsForRule(rule)}
			variant="outline"
		>
			<Play className="h-4 w-4" />
			{t("enterprise.admin.check.run-all-tests")}
		</Button>
	);
};

export const StyleGuideGlobalTestButton = ({ isUiLocked, testManager }: PropsWithManager) => {
	if (testManager.isAnyTestRunning) {
		return (
			<Button className="group" disabled={isUiLocked} onClick={testManager.abortAllTests} variant="outline">
				<LoaderCircle className="h-4 w-4 mr-1 animate-spin group-hover:hidden" />
				<Ban className="h-4 w-4 mr-1 hidden group-hover:inline" />
				{t("enterprise.admin.check.stop-all-tests")}
			</Button>
		);
	}
	return (
		<Button
			className="pl-2.5"
			disabled={isUiLocked || testManager.isAnyTestRunning || !testManager.hasValidTests}
			onClick={testManager.runAllTestsGlobal}
			variant="outline"
		>
			<Play className="h-4 w-4" />
			{t("enterprise.admin.check.run-all-tests")}
		</Button>
	);
};
