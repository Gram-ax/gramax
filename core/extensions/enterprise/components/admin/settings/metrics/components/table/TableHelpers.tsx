import { SortByColumn, SortOrder } from "@ext/enterprise/components/admin/settings/metrics/useMetricsFilters";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "ics-ui-kit/components/tooltip";
import { ArrowDown, ArrowUp } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export const TruncatedText = ({ text, className = "" }: { text: string; className?: string }) => {
	const textRef = useRef<HTMLSpanElement>(null);
	const [isTruncated, setIsTruncated] = useState(false);

	useEffect(() => {
		const element = textRef.current;
		if (element) {
			setIsTruncated(element.scrollWidth > element.clientWidth);
		}
	}, [text]);

	const content = (
		<span
			ref={textRef}
			className={`${className} truncate block`}
			style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
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

interface SortableHeaderProps {
	label: string;
	columnKey: SortByColumn;
	currentSortBy: SortByColumn;
	sortOrder: SortOrder;
	onSortChange: (columnKey: SortByColumn) => void;
	align?: "left" | "center";
}

export const SortableHeader = ({
	label,
	columnKey,
	currentSortBy,
	sortOrder,
	onSortChange,
	align = "center",
}: SortableHeaderProps) => {
	const isActive = currentSortBy === columnKey;
	const SortIcon = sortOrder === "asc" ? ArrowUp : ArrowDown;
	const justifyClass = align === "left" ? "justify-start" : "justify-center";

	return (
		<button
			onClick={() => onSortChange(columnKey)}
			className={`flex items-center ${justifyClass} gap-1 w-full hover:opacity-80 cursor-pointer select-none`}
		>
			<span>{label}</span>
			{isActive && <SortIcon size={14} className="flex-shrink-0" />}
		</button>
	);
};
