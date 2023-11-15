import { ITestCaseHookParameter, ITestStepHookParameter } from "@cucumber/cucumber";

function getFeatureManager() {
	const failedFeatures: string[] = [];

	const getName = (scenario: ITestCaseHookParameter) => scenario.gherkinDocument?.uri || "";
	let currentFeature: string | undefined = void 0;

	return {
		isStepFailed(scenario: ITestStepHookParameter) {
			return scenario?.result?.status == "FAILED";
		},

		isFailed(scenario: ITestCaseHookParameter) {
			return failedFeatures.includes(getName(scenario));
		},

		isNewFeature(scenario: ITestCaseHookParameter) {
			return currentFeature != getName(scenario);
		},

		setCurrent(scenario: ITestCaseHookParameter) {
			currentFeature = getName(scenario);
		},

		addFailed(scenario: ITestStepHookParameter) {
			const path = getName(scenario);
			if (!failedFeatures.includes(path)) failedFeatures.push(path);
		},

		getFailedCount() {
			return failedFeatures.length;
		},

		getSkippedState() {
			return "skipped";
		},
	};
}

const FeatureManager = getFeatureManager();
export default FeatureManager;
