import type { IconCode } from "@components/Atoms/Icon/LucideIcon";
import { cn } from "@core-ui/utils/cn";
import t from "@ext/localization/locale/translate";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@ui-kit/Collapsible";
import { Divider } from "@ui-kit/Divider";
import { Icon } from "@ui-kit/Icon";
import { TextOverflowTooltip } from "@ui-kit/Tooltip";
import { memo, useEffect, useMemo, useState } from "react";
import type { ChatMessage, ToolCallMessage, ToolResultMessage } from "../types/chat";
import { isPlainObject } from "../utils/agentTimeline";
import { ToolPayloadSection, ToolResultSection } from "./ToolPayloadSection";

const TOOL_LABELS: Record<string, string> = {
	list_catalogs: t("agent.tools.list_catalogs"),
	get_navigation: t("agent.tools.get_navigation"),
	search_catalogs: t("agent.tools.search_catalogs"),
	search_files: t("agent.tools.search_files"),
	read_catalog_item: t("agent.tools.read_catalog_item"),
	get_files_navigation: t("agent.tools.get_files_navigation"),
	read_file: t("agent.tools.read_file"),
	get_catalog_item_headings: t("agent.tools.get_catalog_item_headings"),
	create_catalog_item: t("agent.tools.create_catalog_item"),
	write_catalog_item: t("agent.tools.write_catalog_item"),
	replace_catalog_item: t("agent.tools.replace_catalog_item"),
	delete_catalog_item: t("agent.tools.delete_catalog_item"),
	move_catalog_item: t("agent.tools.move_catalog_item"),
	git_inspect: t("agent.tools.git_inspect"),
	git_discard: t("agent.tools.git_discard"),
	read_agent_skill: t("agent.tools.read_agent_skill"),
	read_agent_attachment: t("agent.tools.read_agent_attachment"),
	search_web: t("agent.tools.search_web"),
	http_request: t("agent.tools.http_request"),
	browser_navigate: t("agent.tools.browser_navigate"),
	browser_read_page: t("agent.tools.browser_read_page"),
	browser_read_element: t("agent.tools.browser_read_element"),
	browser_click: t("agent.tools.browser_click"),
	browser_type: t("agent.tools.browser_type"),
	browser_scroll: t("agent.tools.browser_scroll"),
};

const TOOL_ICONS: Record<string, IconCode> = {
	list_catalogs: "list",
	get_navigation: "folder-open",
	search_catalogs: "search",
	search_files: "folder-search",
	read_catalog_item: "file-text",
	get_files_navigation: "folder-open",
	read_file: "file-code",
	get_catalog_item_headings: "file-text",
	create_catalog_item: "file-plus",
	write_catalog_item: "file-pen",
	replace_catalog_item: "file-pen",
	delete_catalog_item: "file-x",
	move_catalog_item: "folder-input",
	git_inspect: "git-compare",
	git_discard: "undo2",
	read_agent_skill: "puzzle",
	read_agent_attachment: "paperclip",
	search_web: "globe",
	http_request: "globe",
	browser_navigate: "globe",
	browser_read_page: "scan-text",
	browser_read_element: "search",
	browser_click: "mouse-pointer-click",
	browser_type: "keyboard",
	browser_scroll: "arrow-down",
};

const getToolLabel = (toolName: string, args?: unknown, itemTitle?: string): string => {
	const base = TOOL_LABELS[toolName] ?? toolName.replace(/_/g, " ");
	if (itemTitle) return `${base} «${itemTitle}»`;
	if (!isPlainObject(args)) return base;
	if (
		(toolName === "search_catalogs" || toolName === "search_files") &&
		typeof args.query === "string" &&
		args.query
	) {
		return `${base} «${args.query}»`;
	}
	// const path = args.itemPath ?? args.path ?? args.id;
	// if (typeof path === "string") {
	// 	const basename = path.split("/").pop() ?? path;
	// 	return `${base}: ${basename}`;
	// }
	return base;
};

const getToolIcon = (toolName: string): IconCode => {
	return TOOL_ICONS[toolName] ?? "wrench";
};

type ToolPair = {
	call: ToolCallMessage | ToolResultMessage;
	result?: ToolResultMessage;
};

const buildPairs = (messages: ChatMessage[]): ToolPair[] => {
	const pairs: ToolPair[] = [];
	const usedResultIds = new Set<string>();

	for (const message of messages) {
		if (message.kind === "tool_call") {
			const result = messages.find(
				(candidate): candidate is ToolResultMessage =>
					candidate.kind === "tool_result" &&
					candidate.toolCallId === message.toolCallId &&
					!usedResultIds.has(candidate.id),
			);
			if (result) usedResultIds.add(result.id);
			pairs.push({ call: message, result });
		} else if (message.kind === "tool_result" && !usedResultIds.has(message.id)) {
			pairs.push({ call: message });
		}
	}

	return pairs;
};

const SHOW_CHECK_DURATION = 3000;

const ToolPairCard = ({ pair }: { pair: ToolPair }) => {
	const [open, setOpen] = useState(false);
	const { call, result } = pair;
	const isPending = call.kind === "tool_call" && !result;
	const isError = result?.toolResultIsError === true;

	const [showCheck, setShowCheck] = useState(false);

	useEffect(() => {
		if (!result?.toolResultTs) return;
		const remaining = SHOW_CHECK_DURATION - (Date.now() - result.toolResultTs);
		if (remaining <= 0) return;
		setShowCheck(true);
		const timer = setTimeout(() => setShowCheck(false), remaining);
		return () => clearTimeout(timer);
	}, [result?.toolResultTs]);

	const toolArguments = call.kind === "tool_call" ? call.toolArguments : undefined;
	const toolItemTitle = call.kind === "tool_call" ? call.toolItemTitle : undefined;
	const toolName = call.toolName;
	const label = getToolLabel(toolName, toolArguments, toolItemTitle);
	const toolIcon = getToolIcon(toolName);

	return (
		<Collapsible onOpenChange={setOpen} open={open}>
			<CollapsibleTrigger asChild>
				<div className="group cursor-pointer flex w-full items-center gap-2 rounded py-0.5 text-left">
					<span className="grid h-4 w-4 shrink-0 place-content-center place-items-center text-muted-foreground [&>*]:[grid-area:1/1]">
						<span
							className={cn(
								"transition-[opacity,transform] duration-150",
								open
									? "scale-75 opacity-0"
									: "scale-100 opacity-100 group-hover:scale-75 group-hover:opacity-0",
							)}
						>
							<Icon className="h-4 w-4" icon={toolIcon} />
						</span>
						<Icon
							className={cn(
								"h-4 w-4 transition-[opacity,transform] duration-150",
								open
									? "rotate-90 scale-100 opacity-100"
									: "scale-75 opacity-0 group-hover:scale-100 group-hover:opacity-100",
							)}
							icon="chevron-right"
						/>
					</span>

					<TextOverflowTooltip className={cn("min-w-0 flex-1 truncate text-sm", "text-muted-foreground")}>
						{label}
					</TextOverflowTooltip>

					{isPending && (
						<Icon className="h-3.5 w-3.5 shrink-0 animate-spin text-muted-foreground" icon="loader2" />
					)}
					{showCheck && <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" icon="check" />}
					{isError && <Icon className="h-3.5 w-3.5 shrink-0 text-destructive" icon="alert-circle" />}
				</div>
			</CollapsibleTrigger>

			<CollapsibleContent>
				<div className="flex items-stretch gap-2 pt-1">
					<div className="flex w-4 shrink-0 justify-center">
						<Divider className="h-auto self-stretch" orientation="vertical" />
					</div>
					<div className="min-w-0 flex-1 space-y-3">
						<ToolPayloadSection label={t("agent.tools.parameters")} payload={toolArguments} />
						{result && (
							<ToolResultSection
								content={result.toolResultContent}
								contentPreview={result.toolResultContentPreview}
								fullLength={result.toolResultFullLength}
								label={t("agent.tools.result")}
							/>
						)}
					</div>
				</div>
			</CollapsibleContent>
		</Collapsible>
	);
};

const ToolSegment = ({ pairs }: { pairs: ToolPair[] }) => {
	const [open, setOpen] = useState(false);

	if (pairs.length === 1) {
		return <ToolPairCard pair={pairs[0]} />;
	}

	return (
		<Collapsible onOpenChange={setOpen} open={open}>
			<CollapsibleTrigger asChild className="w-full cursor-pointer">
				<div className="flex w-full items-center gap-1 text-left text-muted-foreground">
					<div className="text-sm">
						{t("agent.tools.tools")} · {pairs.length}
					</div>
					<Icon className={cn("shrink-0 transition-transform", !open && "-rotate-90")} icon="chevron-down" />
				</div>
			</CollapsibleTrigger>
			<CollapsibleContent className="pt-1 space-y-2">
				{pairs.map((pair) => (
					<ToolPairCard key={pair.call.id} pair={pair} />
				))}
			</CollapsibleContent>
		</Collapsible>
	);
};

type Props = {
	messages: ChatMessage[];
};

export const ToolActivityBundle = memo(({ messages }: Props) => {
	const pairs = useMemo(() => buildPairs(messages), [messages]);

	return (
		<div className="w-full min-w-0 space-y-2">
			<ToolSegment pairs={pairs} />
		</div>
	);
});
