import type { SortByColumn, SortOrder } from "@ext/enterprise/components/admin/settings/metrics/filters";
import { MetricsTooltipHelper } from "@ext/enterprise/components/admin/settings/metrics/search/helpers/TooltipHelper";
import { Icon } from "@ui-kit/Icon";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@ui-kit/Tooltip";
import { useEffect, useRef, useState } from "react";

export const TruncatedText = ({
	text,
	className = "",
	lines = 1,
	showTooltip = true,
}: {
	text: string;
	className?: string;
	lines?: number;
	showTooltip?: boolean;
}) => {
	const textRef = useRef<HTMLSpanElement>(null);
	const [isTruncated, setIsTruncated] = useState(false);
	const isSingleLine = lines === 1;

	useEffect(() => {
		const element = textRef.current;
		if (!element) return;

		const truncated = isSingleLine
			? element.scrollWidth > element.clientWidth
			: element.scrollHeight > element.clientHeight;

		setIsTruncated(truncated);
	}, [isSingleLine]);

	const content = isSingleLine ? (
		<span
			className={`${className} truncate block`}
			ref={textRef}
			style={{
				overflow: "hidden",
				textOverflow: "ellipsis",
				whiteSpace: "nowrap",
			}}
		>
			{text}
		</span>
	) : (
		<span
			className={`${className} block`}
			ref={textRef}
			style={{
				display: "-webkit-box",
				WebkitLineClamp: lines,
				WebkitBoxOrient: "vertical",
				overflow: "hidden",
				wordBreak: "break-word",
				overflowWrap: "break-word",
			}}
		>
			{text}
		</span>
	);

	if (!isTruncated || !showTooltip) {
		return content;
	}

	return (
		<TooltipProvider>
			<Tooltip>
				<TooltipTrigger asChild>{content}</TooltipTrigger>
				<TooltipContent>
					<p className="max-w-md break-words">{text}</p>
				</TooltipContent>
			</Tooltip>
		</TooltipProvider>
	);
};

interface SortableHeaderProps<T extends string = SortByColumn> {
	label: string;
	columnKey: T;
	currentSortBy: T;
	sortOrder: SortOrder;
	onSortChange: (columnKey: T) => void;
	align?: "left" | "center" | "right";
	tooltip?: string;
}

export const SortableHeader = <T extends string = SortByColumn>({
	label,
	columnKey,
	currentSortBy,
	sortOrder,
	onSortChange,
	tooltip,
	align = "center",
}: SortableHeaderProps<T>) => {
	const isActive = currentSortBy === columnKey;
	const justifyClass = align === "left" ? "justify-start" : align === "right" ? "justify-end" : "justify-center";

	return (
		<button
			className={`flex items-center ${justifyClass} gap-1 w-full hover:opacity-80 cursor-pointer select-none`}
			onClick={() => onSortChange(columnKey)}
			type="button"
		>
			{tooltip ? (
				<MetricsTooltipHelper label={label} text={tooltip} />
			) : (
				<span className="text-muted">{label}</span>
			)}
			{isActive && (
				<Icon className="flex-shrink-0" icon={sortOrder === "asc" ? "arrow-up" : "arrow-down"} size="sm" />
			)}
		</button>
	);
};

interface ColumnHeaderWithTooltipProps {
	label: string;
	tooltip: string;
	align?: "left" | "center" | "right";
}

export const ColumnHeaderWithTooltip = ({ label, tooltip, align = "center" }: ColumnHeaderWithTooltipProps) => {
	const textAlignClass = align === "left" ? "text-left" : align === "right" ? "text-right" : "text-center";

	return (
		<div
			className={`${textAlignClass} px-2 flex items-center gap-1 ${align === "left" ? "justify-start" : align === "right" ? "justify-end" : "justify-center"}`}
		>
			<span>{label}</span>
			<TooltipProvider>
				<Tooltip>
					<TooltipTrigger asChild>
						<Icon className="flex-shrink-0 cursor-help" icon="help-circle" size="sm" />
					</TooltipTrigger>
					<TooltipContent>
						<p className="max-w-xs">{tooltip}</p>
					</TooltipContent>
				</Tooltip>
			</TooltipProvider>
		</div>
	);
};
