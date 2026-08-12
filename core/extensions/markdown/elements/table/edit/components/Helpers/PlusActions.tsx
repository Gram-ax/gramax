import Icon from "@components/Atoms/Icon";
import { cn } from "@core-ui/utils/cn";
import { HELPERS_LEFT, VERTICAL_TOP_OFFSET } from "@ext/markdown/elements/table/edit/components/Helpers/consts";
import { type CSSProperties, type MouseEvent, type RefObject, useState } from "react";

interface PlusActionsProps {
	onClick: (index) => void;
	tableRef: RefObject<HTMLElement>;
	index?: number;
	className?: string;
	vertical?: boolean;
	dataQa?: string;
}

type HoveredData = {
	width: string;
	height: string;
};

const PlusActions = (props: PlusActionsProps) => {
	const { index, className, vertical, onClick, dataQa, tableRef } = props;
	const [hoveredData, setHoveredData] = useState<HoveredData>(null);
	const preOnClick = (e: MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();
		onClick(index);
	};

	const preOnMouseEnter = () => {
		const table = tableRef.current;
		const firstRow = table.querySelector(":scope > tbody > tr:first-of-type");
		const top = firstRow.getBoundingClientRect().top;
		const bottom = table.getBoundingClientRect().bottom;
		const hoveredData = {
			width: vertical ? `calc(${table.clientWidth}px)` : "5px",
			height: vertical ? "5px" : `calc(${bottom - top}px)`,
		};

		setHoveredData(hoveredData);
	};

	const preOnMouseLeave = () => {
		setHoveredData(null);
	};

	return (
		<div
			className={cn(
				"group relative h-4 w-4 items-center justify-center",
				"[&.hidden]:pointer-events-none [&_i]:flex [&_i]:items-center [&_i]:justify-center [&_i]:text-[11px] [&_svg]:[stroke-width:0.2rem]",
				className,
				vertical
					? `left-[var(--helpers-left)] top-[calc(var(--vertical-top-offset)*-1)]`
					: `right-[calc(-100%+var(--helpers-left))]`,
				"z-10",
				"!hidden",
				"flex",
			)}
			data-qa={dataQa}
			data-table-plus-action={vertical ? "row" : "column"}
			data-testid={dataQa}
			onMouseEnter={preOnMouseEnter}
			onMouseLeave={preOnMouseLeave}
			style={{ "--helpers-left": HELPERS_LEFT, "--vertical-top-offset": VERTICAL_TOP_OFFSET } as CSSProperties}
		>
			{hoveredData && (
				<div
					className={cn(
						"absolute pointer-events-none bg-[var(--color-table-action-add)] opacity-[0.13]",
						vertical ? "left-[1em] top-[5px]" : "left-[0.4em] top-[1em]",
					)}
					data-table-plus-preview={vertical ? "row" : "column"}
					style={{ width: hoveredData.width, height: hoveredData.height }}
				/>
			)}
			<div
				className="z-[1000] hidden h-0 w-0 cursor-pointer items-center justify-center rounded-[var(--radius-full)] border border-[var(--color-table-plus-border)] bg-[var(--color-table-plus-bg)] p-[0.44rem] text-[var(--color-article-text)] [stroke-width:2rem] pointer-events-none group-hover:!flex group-hover:pointer-events-auto"
				onClick={preOnClick}
			>
				<Icon code="plus" />
			</div>
			<span className="flex h-[3px] w-[3px] rounded-[var(--radius-full)] bg-[var(--color-line)] group-hover:hidden" />
		</div>
	);
};

export default PlusActions;
