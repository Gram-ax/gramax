import { cn } from "@core-ui/utils/cn";
import { TableLoadingRow } from "@ext/enterprise/components/admin/ui-kit/table/TableLoadingRow";
import type { ColumnDef, Table as ReactTable, Row } from "@ui-kit/DataTable";
import { Table, TableBody } from "@ui-kit/Table";
import React, { useCallback, useEffect, useRef } from "react";
import { MemoizedTableRow } from "./MemoizedTableRow";
import { TableBodyComponent } from "./TableBodyComponent";
import { TableHeaderComponent } from "./TableHeaderComponent";

export const TABLE_SELECT_COLUMN_CODE = "select";
export const TABLE_EDIT_COLUMN_CODE = "edit";
export const TABLE_DRAGGABLE_COLUMN_CODE = "draggable";

export interface TableComponentProps<T> {
	table: ReactTable<T>;
	columns: ColumnDef<T>[];
	onRowClick?: (row: Row<T>) => void;
	sortable?: boolean;
	onBottomReached?: () => void;
	isLoading?: boolean;
	isLoadingMore?: boolean;
	rowVersions?: Map<string, number>;
	rowSelection?: Record<string, boolean>;
}

export const TableComponent = <T,>(props: TableComponentProps<T>) => {
	const {
		table,
		columns,
		onRowClick,
		sortable,
		onBottomReached,
		isLoading,
		isLoadingMore,
		rowVersions,
		rowSelection,
	} = props;
	const containerRef = useRef<HTMLDivElement>(null);
	const sentinelRef = useRef<HTMLDivElement>(null);
	const loadingMoreRef = useRef(isLoadingMore);
	loadingMoreRef.current = isLoadingMore;

	useEffect(() => {
		if (!onBottomReached || !sentinelRef.current || !containerRef.current) return;

		const observer = new IntersectionObserver(
			(entries) => {
				if (entries[0]?.isIntersecting && !loadingMoreRef.current) onBottomReached();
			},
			{ root: containerRef.current, threshold: 0 },
		);
		observer.observe(sentinelRef.current);
		return () => observer.disconnect();
	}, [onBottomReached]);

	const renderRow = useCallback(
		(row: Row<T>) => (
			<MemoizedTableRow
				key={row.id}
				onRowClick={onRowClick}
				row={row}
				rowSelection={rowSelection}
				rowVersions={rowVersions}
			/>
		),
		[onRowClick, rowVersions, rowSelection],
	);

	const rows = table.getRowModel()?.rows ?? [];

	return (
		<div className="rounded-lg overflow-hidden border min-h-0">
			<ScrollShadowContainer className="h-full [&>div>div]:overflow-visible" ref={containerRef} topOffset={41}>
				<Table>
					<TableHeaderComponent
						className="sticky top-0 [box-shadow:0_1px_0_0_hsl(var(--border))] [&_tr]:border-0"
						sortable={sortable}
						table={table}
					/>
					{isLoading || (rows.length === 0 && isLoadingMore) ? (
						<>
							<TableBody>
								<TableLoadingRow columns={columns} />
							</TableBody>
						</>
					) : (
						<TableBodyComponent
							columns={columns}
							renderRow={renderRow}
							rows={rows}
							sentinelRef={onBottomReached ? sentinelRef : undefined}
						/>
					)}
				</Table>
			</ScrollShadowContainer>
		</div>
	);
};

interface ScrollShadowContainerProps extends React.HTMLAttributes<HTMLDivElement> {
	children: React.ReactNode;
	shadowSize?: number;
	topOffset?: number;
	bottomOffset?: number;
}

const ScrollShadowContainer = React.forwardRef<HTMLDivElement, ScrollShadowContainerProps>(
	({ className, children, shadowSize = 28, topOffset = 0, bottomOffset = 0, ...props }, ref) => {
		const scrollRef = React.useRef<HTMLDivElement>(null);
		const contentRef = React.useRef<HTMLDivElement>(null);
		const prevStateRef = React.useRef<number>(-1);

		React.useImperativeHandle(ref, () => scrollRef.current as HTMLDivElement);

		const updateMask = React.useCallback(() => {
			const el = scrollRef.current;
			if (!el) return;

			const { scrollTop, scrollHeight, clientHeight } = el;
			const showTop = scrollTop > 0;
			const showBottom = scrollTop < scrollHeight - clientHeight - 1;

			const state = (showTop ? 1 : 0) | (showBottom ? 2 : 0);
			if (state === prevStateRef.current) return;
			prevStateRef.current = state;

			if (state === 0) {
				el.style.maskImage = "";
				el.style.webkitMaskImage = "";
				el.style.maskSize = "";
				el.style.webkitMaskSize = "";
				el.style.maskPosition = "";
				el.style.webkitMaskPosition = "";
				el.style.maskRepeat = "";
				el.style.webkitMaskRepeat = "";
				return;
			}

			const topShadowEnd = topOffset + shadowSize;
			const bottomShadowStart = `calc(100% - ${bottomOffset + shadowSize}px)`;

			const top = showTop ? `black ${topOffset}px, transparent ${topOffset}px, black ${topShadowEnd}px` : "black";
			const bottom = showBottom
				? `black ${bottomShadowStart}, transparent calc(100% - ${bottomOffset}px)`
				: "black";

			const gradient = `linear-gradient(to bottom, ${top}, ${bottom})`;
			const solid = `linear-gradient(black, black)`;

			const scrollbarWidth = el.offsetWidth - el.clientWidth;

			const mask = `${gradient}, ${solid}`;
			const maskSize = `${el.clientWidth}px 100%, ${scrollbarWidth}px 100%`;
			const maskPosition = `left top, right top`;
			const maskRepeat = `no-repeat, no-repeat`;

			el.style.maskImage = mask;
			el.style.webkitMaskImage = mask;
			el.style.maskSize = maskSize;
			el.style.webkitMaskSize = maskSize;
			el.style.maskPosition = maskPosition;
			el.style.webkitMaskPosition = maskPosition;
			el.style.maskRepeat = maskRepeat;
			el.style.webkitMaskRepeat = maskRepeat;
		}, [shadowSize, topOffset, bottomOffset]);

		React.useEffect(() => {
			const el = scrollRef.current;
			if (!el) return;

			updateMask();
			el.addEventListener("scroll", updateMask, { passive: true });
			return () => el.removeEventListener("scroll", updateMask);
		}, [updateMask]);

		React.useEffect(() => {
			const scrollEl = scrollRef.current;
			const contentEl = contentRef.current;
			if (!scrollEl || !contentEl) return;

			const observer = new ResizeObserver(updateMask);
			observer.observe(scrollEl);
			observer.observe(contentEl);
			return () => observer.disconnect();
		}, [updateMask]);

		return (
			<div className={cn("overflow-auto", className)} ref={scrollRef} {...props}>
				<div ref={contentRef}>{children}</div>
			</div>
		);
	},
);
