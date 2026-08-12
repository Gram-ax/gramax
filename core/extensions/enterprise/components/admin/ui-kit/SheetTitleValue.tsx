import { TextOverflowTooltip } from "@ui-kit/Tooltip";

interface SheetTitleValueProps {
	label: React.ReactNode;
	value: string;
}

export const SheetTitleValue = ({ label, value }: SheetTitleValueProps) => (
	<span className="flex flex-wrap items-baseline gap-x-1">
		<span className="whitespace-nowrap">{label}</span>
		<TextOverflowTooltip className="max-w-full text-muted">{value}</TextOverflowTooltip>
	</span>
);
