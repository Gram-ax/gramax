import styled from "@emotion/styled";
import { useStyleGuideTests } from "@ext/enterprise/components/admin/settings/styleGuide/helpers/StyleGuideContext";
import type { StyleGuideRule } from "@ext/enterprise/components/admin/settings/styleGuide/helpers/StyleGuideRuleAdapter";
import t from "@ext/localization/locale/translate";
import { IconButton } from "@ui-kit/Button";
import { Label } from "@ui-kit/Label";
import { Popover, PopoverContent, PopoverTrigger } from "@ui-kit/Popover";
import { AutogrowTextarea } from "@ui-kit/Textarea";
import { Tooltip, TooltipContent, TooltipTrigger } from "@ui-kit/Tooltip";
import type { RuleExample } from "../../types";

interface TestExampleProps {
	rule: StyleGuideRule;
	test: RuleExample & { id: string };
	guid: string;
	isFirst: boolean;
	onDelete: (testId: string) => void;
	onUpdate: (testId: string, updates: Partial<RuleExample>) => void;
}

const DeleteButton = styled(IconButton)`
	&:hover {
		color: var(--color-danger);
	}
`;

export const StyleGuideTestExample = ({ rule, test, guid, isFirst, onDelete, onUpdate }: TestExampleProps) => {
	const { runningTests, runSingleTest } = useStyleGuideTests();
	const isRunning = runningTests.has(`${guid}-${test.id}`) && test.text.length > 0;
	const badgeStatus = test.runResult?.statusCode === "success" ? "success" : "error";

	return (
		<div className="flex items-center gap-2">
			<div className="flex items-center gap-1">
				<Tooltip>
					<TooltipTrigger asChild>
						<IconButton
							disabled={isRunning || test.text.length === 0}
							icon="play"
							onClick={() => runSingleTest(rule, test)}
							size="sm"
							variant="ghost"
						/>
					</TooltipTrigger>
					<TooltipContent>{t("enterprise.admin.check.test-run")}</TooltipContent>
				</Tooltip>
				{isRunning ? (
					<IconButton disabled icon="loader" size="sm" variant="ghost" />
				) : test.runResult ? (
					<Popover>
						<PopoverTrigger asChild>
							<IconButton
								icon={badgeStatus === "success" ? "check" : "x"}
								size="sm"
								status={badgeStatus}
								variant="ghost"
							/>
						</PopoverTrigger>
						<PopoverContent className="w-[400px]">
							<div className="grid gap-4">
								<h4>{t("enterprise.admin.check.test-popup-title")}</h4>
								<div className="grid gap-2">
									<div className="grid items-center grid-cols-3 gap-2">
										<Label>
											{t("enterprise.admin.check.test-popup-done")}:{" "}
											{new Date(test.runResult.dateTimeIso8601).toLocaleString("ru-RU", {
												day: "2-digit",
												month: "2-digit",
												year: "numeric",
												hour: "2-digit",
												minute: "2-digit",
												second: "2-digit",
											})}
										</Label>
									</div>
									<Label>{t("enterprise.admin.check.test-popup-response")}:</Label>
									<pre className="text-xs bg-muted p-2 mt-2 rounded-md overflow-auto">
										{JSON.stringify(test.runResult.result, null, 4)}
									</pre>
								</div>
							</div>
						</PopoverContent>
					</Popover>
				) : (
					<Popover>
						<PopoverTrigger asChild>
							<IconButton icon="info" size="sm" status="default" variant="ghost" />
						</PopoverTrigger>
						<PopoverContent className="w-[400px]">
							<div className="grid gap-4">
								<h4>{t("enterprise.admin.check.test-popup-title")}</h4>
								<div className="grid gap-2">
									<div className="grid items-center grid-cols-3 gap-2">
										<Label>{"Здесь будут результаты теста"}</Label>
									</div>
								</div>
							</div>
						</PopoverContent>
					</Popover>
				)}

				<DeleteButton icon="trash2" onClick={() => onDelete(test.id)} size="sm" variant="ghost" />
			</div>
			<AutogrowTextarea
				autoFocus={isFirst}
				className="flex-1"
				disabled={isRunning}
				minRows={1}
				onChange={(e) => onUpdate(test.id, { text: e.target.value })}
				placeholder={t("enterprise.admin.check.test-placeholder")}
				value={test.text}
			/>
		</div>
	);
};
