import {
	type BadgeInfo,
	StyleGuideHeader,
} from "@ext/enterprise/components/admin/settings/styleGuide/components/StyleGuideHeader";
import { Badge } from "@ui-kit/Badge";
import {
	Sidebar,
	SidebarContent,
	SidebarGroup,
	SidebarGroupContent,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from "@ui-kit/Sidebar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@ui-kit/Tooltip";
import type { LgtRule, LlmRule, RuleExample } from "../StyleGuideComponent";

const getTitle = (xml?: string) => {
	const nameRegex =
		/<(?:rule|rulegroup)(?:\s+[^>]*?)?(?:\s+name="([^"]*)"|\s+id="[^"]*"\s+name="([^"]*)"|\s+name="([^"]*)"\s+id="[^"]*")(?:\s+[^>]*?)?>/;
	const match = (xml ?? "").match(nameRegex);
	if (match) return match[1] || match[2] || match[3] || "";
	return "";
};

function getSingleRuleBadgeInfo(testCases: RuleExample[] | undefined): BadgeInfo {
	if (!testCases?.length) return { status: "default", label: "0/0" };

	const ran = testCases.filter((tc) => tc.runResult);
	const passed = ran.filter((tc) => tc.runResult?.statusCode === "success");

	if (ran.length === 0) {
		return { status: "default", label: `0/${testCases.length}` };
	}

	if (passed.length === ran.length) {
		return { status: "success", label: `${passed.length}/${testCases.length}` };
	}

	return { status: "error", label: `${passed.length}/${testCases.length}` };
}

interface StyleGuideSidebarProps {
	lgtRules: LgtRule[];
	llmRules: LlmRule[];
	activeProvider: "lgt" | "llm";
	selectedLgtGuid: string | null;
	selectedLlmGuid: string | null;
	onActivate: (provider: "lgt" | "llm", guid: string) => void;
	onAddLgt: () => void;
	onAddLlm: () => void;
}

export const StyleGuideSidebar = ({
	lgtRules,
	llmRules,
	activeProvider,
	selectedLgtGuid,
	selectedLlmGuid,
	onActivate,
	onAddLgt,
	onAddLlm,
}: StyleGuideSidebarProps) => {
	return (
		<Sidebar className="min-w-[400px] rounded-md" collapsible="none">
			<SidebarContent>
				<StyleGuideHeader onAdd={onAddLgt} testCases={lgtRules} title="LGT" />
				<SidebarGroup>
					<SidebarGroupContent>
						<SidebarMenu>
							{lgtRules.map((rule, index) => {
								const badge = getSingleRuleBadgeInfo(rule.testCases);
								const isEnabled = rule.enabled ?? true;
								return (
									<SidebarMenuItem key={rule.guid}>
										<SidebarMenuButton
											className={`justify-between ${!isEnabled ? "opacity-50 text-zinc-500" : ""}`}
											isActive={activeProvider === "lgt" && selectedLgtGuid === rule.guid}
											onClick={() => onActivate("lgt", rule.guid)}
										>
											<span className="whitespace-nowrap overflow-hidden overflow-ellipsis">
												{`${index + 1}. ${getTitle(rule.xml)}`}
											</span>
											<Tooltip>
												<TooltipTrigger>
													<Badge className="shrink-0" status={badge.status}>
														{badge.label}
													</Badge>
												</TooltipTrigger>
												<TooltipContent>Тестов пройдено</TooltipContent>
											</Tooltip>
										</SidebarMenuButton>
									</SidebarMenuItem>
								);
							})}
						</SidebarMenu>
					</SidebarGroupContent>
				</SidebarGroup>
				<StyleGuideHeader onAdd={onAddLlm} testCases={llmRules} title="LLM" />
				<SidebarGroup>
					<SidebarGroupContent>
						<SidebarMenu>
							{llmRules.map((rule, index) => {
								const badge = getSingleRuleBadgeInfo(rule.testCases);
								const isEnabled = rule.enabled ?? true;
								return (
									<SidebarMenuItem key={rule.guid}>
										<SidebarMenuButton
											className={`justify-between ${!isEnabled ? "opacity-50 text-zinc-500" : ""}`}
											isActive={activeProvider === "llm" && selectedLlmGuid === rule.guid}
											onClick={() => onActivate("llm", rule.guid)}
										>
											<span className="whitespace-nowrap overflow-hidden overflow-ellipsis">
												{`${index + 1}. ${rule.name}`}
											</span>
											<Tooltip>
												<TooltipTrigger>
													<Badge className="shrink-0" status={badge.status}>
														{badge.label}
													</Badge>
												</TooltipTrigger>
												<TooltipContent>Тестов пройдено</TooltipContent>
											</Tooltip>
										</SidebarMenuButton>
									</SidebarMenuItem>
								);
							})}
						</SidebarMenu>
					</SidebarGroupContent>
				</SidebarGroup>
			</SidebarContent>
		</Sidebar>
	);
};
