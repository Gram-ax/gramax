import type { LgtRule, LlmRule, RuleExample } from "../types";

type BadgeInfo = {
	status: "default" | "success" | "error";
	label: string;
	tooltip?: string;
};

function getTestStats(testCases: RuleExample[]) {
	const valid = testCases.filter((tc) => tc.text?.trim());
	const ran = valid.filter((tc) => tc.runResult);
	const passed = ran.filter((tc) => tc.runResult?.statusCode === "success");

	return { valid: valid.length, ran: ran.length, passed: passed.length };
}

export function getSingleRuleBadgeInfo(testCases: RuleExample[]): BadgeInfo {
	const { valid, ran, passed } = getTestStats(testCases);

	if (valid === 0) return { status: "default", label: "0/0" };
	if (ran === 0) return { status: "default", label: `0/${valid}` };

	const status = passed < ran ? "error" : "success";
	return { status, label: `${passed}/${valid}` };
}

export function getRuleBadgeInfo(rules: (LgtRule | LlmRule)[]): BadgeInfo {
	if (!rules.length) return { status: "default", label: "0" };

	const enabled = rules.filter((r) => r.enabled ?? true);

	const fullyPassed = enabled.filter((rule) => {
		const { valid, ran, passed } = getTestStats(rule.testCases);
		return valid > 0 && ran > 0 && passed === ran;
	});

	const hasFailed = enabled.some((rule) => {
		const { valid, ran, passed } = getTestStats(rule.testCases);
		return valid > 0 && ran > 0 && passed < ran;
	});

	const label = `${fullyPassed.length}/${enabled.length}`;
	const tooltip = `${fullyPassed.length} из ${enabled.length} пройдено успешно`;
	if (hasFailed) return { status: "error", label, tooltip };
	if (fullyPassed.length > 0) return { status: "success", label, tooltip };
	return { status: "default", label: `${enabled.length}` };
}
