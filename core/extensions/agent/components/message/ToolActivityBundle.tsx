import t from "@ext/localization/locale/translate";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@ui-kit/Collapsible";
import { Icon } from "@ui-kit/Icon";
import { TextOverflowTooltip } from "@ui-kit/Tooltip";
import { clsx } from "clsx";
import {
	AlertCircle,
	Check,
	ChevronRight,
	FilePen,
	FilePlus,
	FileText,
	FileX,
	FolderInput,
	FolderOpen,
	GitCompare,
	List,
	Loader2,
	Search,
	Undo2,
	Wrench,
} from "lucide-react";
import type { ComponentType } from "react";
import { useEffect, useState } from "react";
import type { ChatMessage, DiffBlock } from "../types/chat";
import { isPlainObject } from "../utils/agentTimeline";
import { DiffViewer } from "./DiffViewer";
import { ToolPayloadSection, ToolResultSection } from "./ToolPayloadSection";

const TOOL_LABELS: Record<string, string> = {
	list_catalogs: t("agent.tools.list_catalogs"),
	get_navigation: t("agent.tools.get_navigation"),
	search_catalogs: t("agent.tools.search_catalogs"),
	read_catalog_item: t("agent.tools.read_catalog_item"),
	get_catalog_item_headings: t("agent.tools.get_catalog_item_headings"),
	create_catalog_item: t("agent.tools.create_catalog_item"),
	update_catalog_item: t("agent.tools.update_catalog_item"),
	delete_catalog_item: t("agent.tools.delete_catalog_item"),
	move_catalog_item: t("agent.tools.move_catalog_item"),
	git_inspect: t("agent.tools.git_inspect"),
	git_discard: t("agent.tools.git_discard"),
};

type IconComponent = ComponentType<{ className?: string }>;

const TOOL_ICONS: Record<string, IconComponent> = {
	list_catalogs: List,
	get_navigation: FolderOpen,
	search_catalogs: Search,
	read_catalog_item: FileText,
	get_catalog_item_headings: FileText,
	create_catalog_item: FilePlus,
	update_catalog_item: FilePen,
	delete_catalog_item: FileX,
	move_catalog_item: FolderInput,
	git_inspect: GitCompare,
	git_discard: Undo2,
};

function getToolLabel(toolName: string, args?: unknown): string {
	const base = TOOL_LABELS[toolName] ?? toolName.replace(/_/g, " ");
	if (!isPlainObject(args)) return base;
	const path = args.itemPath ?? args.path ?? args.id;
	if (typeof path === "string") {
		const basename = path.split("/").pop() ?? path;
		return `${base}: ${basename}`;
	}
	return base;
}

function getToolIcon(toolName: string): IconComponent {
	return TOOL_ICONS[toolName] ?? Wrench;
}

type ToolPair = {
	call: ChatMessage;
	result?: ChatMessage;
};

function pairToolMessages(messages: ChatMessage[]): ToolPair[] {
	const pairs: ToolPair[] = [];
	const usedResultIds = new Set<string>();

	for (const message of messages) {
		if (message.kind === "tool_call") {
			const result = messages.find(
				(candidate) =>
					candidate.kind === "tool_result" &&
					candidate.toolCallId === message.toolCallId &&
					!usedResultIds.has(candidate.id),
			);

			if (result) {
				usedResultIds.add(result.id);
			}

			pairs.push({ call: message, result });
			continue;
		}

		if (message.kind === "tool_result" && !usedResultIds.has(message.id)) {
			pairs.push({ call: message });
		}
	}

	return pairs;
}

const SHOW_CHECK_DURATION = 3000;

function ToolPairCard({ pair }: { pair: ToolPair }) {
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

	const toolName = call.toolName ?? result?.toolName ?? "";
	const label = getToolLabel(toolName, call.toolArguments);
	const ToolIcon = getToolIcon(toolName);

	return (
		<Collapsible onOpenChange={setOpen} open={open}>
			<CollapsibleTrigger asChild>
				<div className="group cursor-pointer flex w-full items-center gap-2 rounded py-0.5 text-left">
					<span className="grid h-4 w-4 shrink-0 place-content-center place-items-center text-muted-foreground [&>*]:[grid-area:1/1]">
						<span
							className={clsx(
								"transition-[opacity,transform] duration-150",
								open
									? "scale-75 opacity-0"
									: "scale-100 opacity-100 group-hover:scale-75 group-hover:opacity-0",
							)}
						>
							<ToolIcon className="h-4 w-4" />
						</span>
						<ChevronRight
							className={clsx(
								"h-4 w-4 transition-[opacity,transform] duration-150",
								open
									? "rotate-90 scale-100 opacity-100"
									: "scale-75 opacity-0 group-hover:scale-100 group-hover:opacity-100",
							)}
						/>
					</span>

					<TextOverflowTooltip className="min-w-0 flex-1 truncate text-sm text-secondary-fg">
						{label}
					</TextOverflowTooltip>

					{isPending && <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-muted-foreground" />}
					{showCheck && <Check className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />}
					{isError && <AlertCircle className="h-3.5 w-3.5 shrink-0 text-destructive" />}
				</div>
			</CollapsibleTrigger>

			<CollapsibleContent>
				<div className="space-y-3 pr-2 pl-6 pb-2">
					<ToolPayloadSection
						filterKeys={call.toolDiff ? ["content", "itemPath"] : undefined}
						label={t("agent.tools.parameters")}
						payload={call.toolArguments}
					/>
					{result && (
						<ToolResultSection
							contentPreview={result.toolResultContentPreview}
							fullLength={result.toolResultFullLength}
							label={t("agent.tools.result")}
						/>
					)}
				</div>
			</CollapsibleContent>
		</Collapsible>
	);
}

type PairSegment = {
	pairs: ToolPair[];
	diff: DiffBlock | null;
};

function splitPairsIntoSegments(pairs: ToolPair[]): PairSegment[] {
	const segments: PairSegment[] = [];
	let current: ToolPair[] = [];

	for (const pair of pairs) {
		current.push(pair);
		if (pair.call.toolDiff) {
			segments.push({ pairs: current, diff: pair.call.toolDiff });
			current = [];
		}
	}

	if (current.length > 0) {
		segments.push({ pairs: current, diff: null });
	}

	return segments;
}

function ToolSegment({ pairs }: { pairs: ToolPair[] }) {
	const [open, setOpen] = useState(false);

	if (pairs.length === 1) {
		return <ToolPairCard pair={pairs[0]} />;
	}

	return (
		<Collapsible onOpenChange={setOpen} open={open}>
			<CollapsibleTrigger asChild className="w-full cursor-pointer">
				<div className="flex w-full items-center gap-1 text-left">
					<div className="text-sm text-muted-foreground">
						{t("agent.tools.tools")} · {pairs.length}
					</div>
					<Icon
						className={clsx("shrink-0 transition-transform", !open && "-rotate-90")}
						icon="chevron-down"
					/>
				</div>
			</CollapsibleTrigger>
			<CollapsibleContent className="pt-1 space-y-2">
				{pairs.map((pair) => (
					<ToolPairCard key={pair.call.id} pair={pair} />
				))}
			</CollapsibleContent>
		</Collapsible>
	);
}

type Props = {
	messages: ChatMessage[];
};

export function ToolActivityBundle({ messages }: Props) {
	const pairs = pairToolMessages(messages);
	const segments = splitPairsIntoSegments(pairs);

	return (
		<div className="w-full min-w-0 space-y-2">
			{segments.map((segment) => {
				const segKey = `${segment.pairs[0]?.call.id ?? "seg"}-${segment.diff?.filePath ?? "nodiff"}`;
				return (
					<div className="space-y-2" key={segKey}>
						<ToolSegment pairs={segment.pairs} />
						{segment.diff && <DiffViewer defaultCollapsed={false} diff={segment.diff} />}
					</div>
				);
			})}
		</div>
	);
}
