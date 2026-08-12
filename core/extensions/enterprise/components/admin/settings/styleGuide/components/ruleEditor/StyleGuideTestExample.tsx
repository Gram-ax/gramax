import { useStyleGuideTests } from "@ext/enterprise/components/admin/settings/styleGuide/helpers/StyleGuideContext";
import type { StyleGuideRule } from "@ext/enterprise/components/admin/settings/styleGuide/helpers/StyleGuideRuleAdapter";
import t from "@ext/localization/locale/translate";
import CodeBlock from "@ext/markdown/elements/codeBlockLowlight/render/component/CodeBlock";
import { Alert, AlertDescription, AlertTitle } from "@ui-kit/Alert";
import { IconButton } from "@ui-kit/Button";
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
					<TooltipContent className="font-sans font-normal">
						{t("enterprise.admin.check.test-run")}
					</TooltipContent>
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
							<Alert className="p-0 border-none w-[364px]">
								<div className="w-[364px]">
									<AlertTitle>{t("enterprise.admin.check.test-popup-title")}</AlertTitle>
									<div className="flex flex-row w-full pt-1 gap-2 justify-between">
										<AlertDescription>
											{t("enterprise.admin.check.test-popup-done")}:{" "}
											{new Date(test.runResult.dateTimeIso8601).toLocaleString("ru-RU", {
												day: "2-digit",
												month: "2-digit",
												year: "numeric",
												hour: "2-digit",
												minute: "2-digit",
												second: "2-digit",
											})}
										</AlertDescription>
									</div>
									<CodeBlock
										language="json"
										style={{ overflow: "auto", width: "100%", marginTop: "8px" }}
									>
										{JSON.stringify(test.runResult.result, null, 4)}
									</CodeBlock>
								</div>
							</Alert>
						</PopoverContent>
					</Popover>
				) : (
					<Popover>
						<PopoverTrigger asChild>
							<IconButton icon="info" size="sm" status="default" variant="ghost" />
						</PopoverTrigger>
						<PopoverContent className="w-[400px]">
							<Alert className="p-0 border-none">
								<AlertTitle>{t("enterprise.admin.check.test-popup-title")}</AlertTitle>
								<AlertDescription>{t("enterprise.admin.check.test-popup-empty")}</AlertDescription>
							</Alert>
						</PopoverContent>
					</Popover>
				)}

				<IconButton
					className="hover:text-[var(--color-danger)]"
					icon="trash2"
					onClick={() => onDelete(test.id)}
					size="sm"
					variant="ghost"
				/>
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
