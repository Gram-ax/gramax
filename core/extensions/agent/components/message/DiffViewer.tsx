import { cn } from "@core-ui/utils/cn";
import { Button } from "@ui-kit/Button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@ui-kit/Collapsible";
import { Icon } from "@ui-kit/Icon";
import { useMemo, useState } from "react";
import type { DiffBlock, DiffLine } from "../types/chat";
import { countDiffStats } from "../utils/diffHelpers";

const PREVIEW_LINE_COUNT = 12;

type Props = {
	diff: DiffBlock;
	defaultCollapsed?: boolean;
	id?: string;
};

type Chunk = { label?: string; lines: DiffLine[] };

const splitIntoChunks = (lines: DiffLine[]): Chunk[] => {
	const chunks: Chunk[] = [];
	let current: Chunk = { lines: [] };

	for (const line of lines) {
		if (line.type === "hunk") {
			if (current.lines.length > 0) chunks.push(current);
			current = { label: line.text, lines: [] };
		} else {
			current.lines.push(line);
		}
	}

	if (current.lines.length > 0) chunks.push(current);

	return chunks;
};

const truncateChunks = (chunks: Chunk[], limit: number): Chunk[] => {
	let remaining = limit;
	const result: Chunk[] = [];

	for (const chunk of chunks) {
		if (remaining <= 0) break;

		if (chunk.lines.length <= remaining) {
			result.push(chunk);
			remaining -= chunk.lines.length;
		} else {
			result.push({
				...chunk,
				lines: chunk.lines.slice(0, remaining),
			});
			remaining = 0;
		}
	}

	return result;
};

const DiffLineRow = ({ line }: { line: DiffLine }) => {
	return (
		<div
			className={cn(
				"flex min-h-[16px]",
				line.type === "add" && "bg-status-success-bg",
				line.type === "del" && "bg-status-error-bg",
			)}
		>
			<div
				className={cn(
					"w-1 shrink-0",
					line.type === "add" && "bg-status-success",
					line.type === "del" && "bg-status-error",
				)}
			/>
			<span className="flex-1 whitespace-nowrap px-3 py-px font-mono text-[12px] leading-normal text-primary-fg">
				{line.text}
			</span>
		</div>
	);
};

export const DiffViewer = ({ diff, defaultCollapsed = false, id }: Props) => {
	const [isOpen, setIsOpen] = useState(!defaultCollapsed);
	const [expanded, setExpanded] = useState(false);

	const { added, removed } = useMemo(() => countDiffStats(diff.lines), [diff.lines]);

	const chunks = useMemo(() => splitIntoChunks(diff.lines), [diff.lines]);

	const totalLines = useMemo(() => diff.lines.filter((l) => l.type !== "hunk").length, [diff.lines]);

	const isLarge = totalLines > PREVIEW_LINE_COUNT;

	const visibleChunks = useMemo(
		() => (isLarge && !expanded ? truncateChunks(chunks, PREVIEW_LINE_COUNT) : chunks),
		[chunks, isLarge, expanded],
	);

	const content = visibleChunks.map((chunk, idx) => (
		<div key={`${chunk.label ?? "chunk"}-${idx}`}>
			<div className={cn(idx > 0 && !chunk.label && "border-t border-border")}>
				{chunk.lines.map((line, lineIdx) => (
					<DiffLineRow key={`${line.type}-${line.text}-${lineIdx}`} line={line} />
				))}
			</div>
		</div>
	));

	return (
		<div className="w-full min-w-0 overflow-hidden rounded-lg border border-border" id={id}>
			<Collapsible onOpenChange={setIsOpen} open={isOpen}>
				<CollapsibleTrigger className="w-full">
					<div className="flex w-full items-center gap-1 px-1.5 py-1 text-left">
						<Icon
							className={cn("shrink-0 transition-transform", !isOpen && "-rotate-90")}
							icon="chevron-down"
						/>
						<span
							className="min-w-0 flex-1 truncate text-xs font-medium tracking-wide text-muted-foreground"
							title={diff.filePath}
						>
							{diff.filePath}
						</span>
						<span className="shrink-0 font-mono text-xs">
							{added > 0 && <span className="text-emerald-500">+{added}</span>}
							{added > 0 && removed > 0 && <span className="text-muted-foreground"> </span>}
							{removed > 0 && <span className="text-red-500">-{removed}</span>}
						</span>
					</div>
				</CollapsibleTrigger>

				<CollapsibleContent className="w-full min-w-0">
					<div className="relative border-t border-border">
						<div className="w-full overflow-x-auto">
							<div className="min-w-max">{content}</div>
						</div>

						{isLarge && (
							<Button
								className={cn(
									"absolute bottom-1 h-6 left-0 z-20 w-full",
									"flex items-center justify-center gap-1",
									"px-2 rounded-md",
									"transition",
								)}
								onClick={() => setExpanded((e) => !e)}
								size="sm"
								variant="text"
							>
								<Icon
									className={cn("transition-transform", expanded && "-rotate-180")}
									icon="chevron-down"
								/>
							</Button>
						)}
					</div>
				</CollapsibleContent>
			</Collapsible>
		</div>
	);
};
