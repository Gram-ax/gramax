import { Badge } from "@ui-kit/Badge";
import { Button } from "@ui-kit/Button";
import { Icon } from "@ui-kit/Icon";
import { Tooltip, TooltipContent, TooltipTrigger } from "@ui-kit/Tooltip";
import type { LgtRule, LlmRule } from "../StyleGuideComponent";

export type BadgeInfo = { status: "default" | "success" | "error"; label: string };

export function getRuleBadgeInfo(rules: (LgtRule | LlmRule)[]): BadgeInfo {
	if (!rules.length) return { status: "default", label: "0/0" };

	const enabledRules = rules.filter((r) => r.enabled ?? true);

	const testedRules = enabledRules.filter((rule) => {
		const tests = rule.testCases ?? [];
		if (tests.length === 0) return false;

		const ran = tests.filter((tc) => tc.runResult);
		if (ran.length === 0) return false;

		const passed = ran.filter((tc) => tc.runResult?.statusCode === "success");
		return ran.length === tests.length && passed.length === ran.length;
	});

	if (testedRules.length === 0) {
		return { status: "default", label: `0/${enabledRules.length}` };
	}

	if (testedRules.length === enabledRules.length) {
		return { status: "success", label: `${testedRules.length}/${enabledRules.length}` };
	}

	return { status: "error", label: `${testedRules.length}/${enabledRules.length}` };
}

interface StyleGuideHeaderProps {
	title: string;
	onAdd?: () => void;
	testCases?: (LlmRule | LgtRule)[];
}

export const StyleGuideHeader = ({ title, onAdd, testCases }: StyleGuideHeaderProps) => {
	const badge = getRuleBadgeInfo(testCases);
	return (
		<div className="p-4 flex justify-between items-center">
			<div className="flex items-center gap-1">
				<h2 className="text-base font-semibold">{title}-правила</h2>
				<Tooltip>
					<TooltipTrigger asChild>
						<Button disabled={!onAdd} onClick={onAdd} size="xs" variant="ghost">
							<Icon icon="plus" size="md" />
						</Button>
					</TooltipTrigger>
					<TooltipContent>Добавить {title} правило</TooltipContent>
				</Tooltip>
			</div>
			<Tooltip>
				<TooltipTrigger>
					<Badge status={badge.status}>{badge.label}</Badge>
				</TooltipTrigger>
				<TooltipContent>Правил протестировано</TooltipContent>
			</Tooltip>
		</div>
	);
};
