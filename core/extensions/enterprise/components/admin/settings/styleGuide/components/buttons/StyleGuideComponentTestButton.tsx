import { useStyleGuideTests } from "@ext/enterprise/components/admin/settings/styleGuide/helpers/StyleGuideContext";
import type { StyleGuideRule } from "@ext/enterprise/components/admin/settings/styleGuide/helpers/StyleGuideRuleAdapter";
import t from "@ext/localization/locale/translate";
import { Button } from "@ui-kit/Button";
import { Ban, LoaderCircle, Play } from "lucide-react";

interface StyleGuideComponentTestButtonProps {
	isUiLocked: boolean;
	rule?: StyleGuideRule;
}

export function StyleGuideComponentTestButton({ isUiLocked, rule }: StyleGuideComponentTestButtonProps) {
	const { isAnyTestRunning, hasValidTests, abortAllTests, runAllTestsForRule, runAllTestsGlobal } =
		useStyleGuideTests();

	const runTests = () => {
		if (!rule) {
			runAllTestsGlobal();
		} else {
			runAllTestsForRule(rule);
		}
	};

	if (isAnyTestRunning && !rule) {
		return (
			<Button className="abort-test-button" disabled={isUiLocked} onClick={abortAllTests} variant="outline">
				<LoaderCircle className="abort-loader animate-spin h-4 w-4 mr-1" />
				<Ban className="abort-stop h-4 w-4 mr-1" />
				{t("enterprise.admin.check.stop-all-tests")}
			</Button>
		);
	}

	return (
		<Button
			className="pl-[10px] px-3"
			disabled={isUiLocked || isAnyTestRunning || !hasValidTests}
			onClick={runTests}
			variant="outline"
		>
			<Play className="h-4 w-4" />
			{t("enterprise.admin.check.run-all-tests")}
		</Button>
	);
}
