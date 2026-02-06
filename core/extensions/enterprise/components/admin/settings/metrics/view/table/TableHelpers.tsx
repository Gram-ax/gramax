import type { SortByColumn, SortOrder } from "@ext/enterprise/components/admin/settings/metrics/filters";
import { MetricsTooltipHelper } from "@ext/enterprise/components/admin/settings/metrics/search/helpers/TooltipHelper";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "ics-ui-kit/components/tooltip";
import { ArrowDown, ArrowUp, HelpCircle } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export const TruncatedText = ({ text, className = "" }: { text: string; className?: string }) => {
	const textRef = useRef<HTMLSpanElement>(null);
	const [isTruncated, setIsTruncated] = useState(false);

	useEffect(() => {
		const element = textRef.current;
		if (element) {
			setIsTruncated(element.scrollWidth > element.clientWidth);
		}
	}, []);

	const content = (
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
	);

	if (!isTruncated) {
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
	const SortIcon = sortOrder === "asc" ? ArrowUp : ArrowDown;
	const justifyClass = align === "left" ? "justify-start" : align === "right" ? "justify-end" : "justify-center";

	return (
		<button
			className={`flex items-center ${justifyClass} gap-1 w-full hover:opacity-80 cursor-pointer select-none`}
			onClick={() => onSortChange(columnKey)}
			type="button"
		>
			<span>{label}</span>
			{tooltip ? <MetricsTooltipHelper text={tooltip} /> : null}
			{isActive && <SortIcon className="flex-shrink-0" size={14} />}
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
						<HelpCircle className="flex-shrink-0 cursor-help" size={14} />
					</TooltipTrigger>
					<TooltipContent>
						<p className="max-w-xs">{tooltip}</p>
					</TooltipContent>
				</Tooltip>
			</TooltipProvider>
		</div>
	);
};
