import { flexRender } from "@ui-kit/DataTable";
import { useVirtualizer } from "@tanstack/react-virtual";
import { DependencyList, Dispatch, SetStateAction, memo, useCallback, useEffect, useRef, useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@ui-kit/Table";
import {
	columnThClassName,
	TABLE_COLUMN_CODE_DEFAULT,
	TABLE_EDIT_COLUMN_CODE,
	TABLE_SELECT_COLUMN_CODE,
	TableComponentProps,
} from "@ext/enterprise/components/admin/ui-kit/table/TableComponent";
import { TableEmptyRow } from "@ext/enterprise/components/admin/ui-kit/table/TableEmptyRow";
import { cn } from "@core-ui/utils/cn";
import { ScrollShadowContainer } from "@ui-kit/ScrollShadowContainer";
import { TableLoadingRow } from "@ext/enterprise/components/admin/ui-kit/table/TableLoadingRow";
import styled from "@emotion/styled";
import useWatch from "@core-ui/hooks/useWatch";

export type RequestCursor = {
	id: string;
	created_at: string;
};

export type RequestData<T> = {
	data: T[];
	has_more: boolean;
	next_cursor: RequestCursor;
};

interface LazyInfinityTableProps<T> extends TableComponentProps<T> {
	deps: DependencyList;
	hasMore: boolean;
	setData: Dispatch<SetStateAction<T[]>>;
	loadOptions: () => Promise<RequestData<T>>;
}

const Wrapper = styled.div`
	> div {
		overflow: unset;
	}

	thead {
		position: sticky;
	}
`;

const LazyInfinityTableComponent = <T,>(props: LazyInfinityTableProps<T>) => {
	const { loadOptions, table, columns, onRowClick, hasMore, setData, deps } = props;
	const scrollContainerRef = useRef<HTMLDivElement>(null);
	const [isFetching, setIsFetching] = useState(false);
	const isInitialLoadComplete = useRef(false);
	const lastScrollTop = useRef(0);

	const hasScroll = useCallback(() => {
		const scrollContainer = scrollContainerRef.current;
		if (!scrollContainer) return false;
		return scrollContainer.scrollHeight > scrollContainer.clientHeight;
	}, []);

	useWatch(() => {
		isInitialLoadComplete.current = false;
		setIsFetching(false);
		lastScrollTop.current = 0;
		setData([]);
	}, [...deps]);

	useEffect(() => {
		const fetchUntilScroll = async () => {
			if (isInitialLoadComplete.current) return;

			const loadBatch = async () => {
				if (!hasMore) {
					isInitialLoadComplete.current = true;
					return;
				}

				if (isFetching) return;

				setIsFetching(true);
				const newData = await loadOptions();

				setData((prevData) => [...prevData, ...newData.data]);
				setIsFetching(false);

				if (!newData.has_more) {
					setIsFetching(false);
					isInitialLoadComplete.current = true;
					return;
				}

				const shouldContinue = !hasScroll() && newData.has_more;

				if (shouldContinue) await loadBatch();
				else isInitialLoadComplete.current = true;
			};

			await loadBatch();
		};

		fetchUntilScroll();
	}, [loadOptions, hasMore, isFetching, hasScroll]);

	const fetchMoreOnBottomReached = useCallback(async () => {
		if (!isInitialLoadComplete.current) return;

		const scrollContainer = scrollContainerRef.current;
		if (!scrollContainer) return;

		const canLoadMore = hasMore;
		if (!canLoadMore) return;

		const { scrollHeight, scrollTop, clientHeight } = scrollContainer;
		lastScrollTop.current = scrollTop;

		if (scrollTop + clientHeight >= scrollHeight - clientHeight * 0.2 && !isFetching) {
			setIsFetching(true);

			const scrollHeightBefore = scrollHeight;
			const scrollTopBefore = scrollTop;

			const newData = await loadOptions();
			if (!newData.has_more) return;
			setData((prevData) => [...prevData, ...newData.data]);

			requestAnimationFrame(() => {
				if (scrollContainer && scrollContainerRef.current) {
					const scrollHeightAfter = scrollContainer.scrollHeight;
					const heightDiff = scrollHeightAfter - scrollHeightBefore;

					if (heightDiff > 0) scrollContainer.scrollTop = scrollTopBefore;
				}
			});

			setIsFetching(false);
		}
	}, [loadOptions, setData, hasMore, isFetching]);

	const { rows } = table.getRowModel();

	const rowVirtualizer = useVirtualizer({
		count: rows.length,
		estimateSize: () => 40,
		getScrollElement: () => scrollContainerRef.current,
		overscan: 10,
	});

	return (
		<div className="relative overflow-hidden flex flex-col max-h-full h-full">
			<ScrollShadowContainer
				ref={scrollContainerRef}
				className="flex-1 overflow-y-auto max-h-full"
				shadowTopClassName="mt-10"
				onScrollCapture={() => fetchMoreOnBottomReached()}
			>
				<Wrapper className="border rounded-md">
					<Table className="min-w-full" style={{ tableLayout: "fixed" }}>
						<TableHeader className="h-10 bg-secondary-bg top-0 z-10">
							{table.getHeaderGroups().map((headerGroup) => (
								<TableRow key={headerGroup.id} className="h-10 items-center">
									{headerGroup.headers.map((header, idx) => (
										<TableHead
											key={header.id}
											className={cn(
												columnThClassName[header.column.id as keyof typeof columnThClassName] ||
													columnThClassName[TABLE_COLUMN_CODE_DEFAULT],
												idx === 0 ? "pl-3" : "",
												"h-10 items-center whitespace-nowrap",
											)}
										>
											{header.isPlaceholder
												? null
												: flexRender(header.column.columnDef.header, header.getContext())}
										</TableHead>
									))}
								</TableRow>
							))}
						</TableHeader>
						<TableBody>
							{table.getRowModel().rows?.length ? (
								<>
									<tr style={{ height: `${rowVirtualizer.getVirtualItems()[0]?.start ?? 0}px` }} />
									{rowVirtualizer.getVirtualItems().map((virtualRow) => {
										const row = rows[virtualRow.index];
										return (
											<TableRow
												key={row.id}
												className="h-10 items-center"
												data-state={row.getIsSelected() && "selected"}
											>
												{row.getVisibleCells().map((cell, idx) => (
													<TableCell
														key={cell.id}
														onClick={
															cell.column.id === TABLE_SELECT_COLUMN_CODE
																? (e) => e.stopPropagation()
																: cell.column.id === TABLE_EDIT_COLUMN_CODE
																? () => onRowClick?.(row)
																: undefined
														}
														className={cn(
															columnThClassName[
																cell.column.id as keyof typeof columnThClassName
															] || columnThClassName[TABLE_COLUMN_CODE_DEFAULT],
															idx === 0 ? "pl-3" : "",
															"overflow-hidden",
														)}
													>
														{flexRender(cell.column.columnDef.cell, cell.getContext())}
													</TableCell>
												))}
											</TableRow>
										);
									})}
									<tr
										style={{
											height: `${
												rowVirtualizer.getTotalSize() -
												(rowVirtualizer.getVirtualItems()[
													rowVirtualizer.getVirtualItems().length - 1
												]?.end ?? 0)
											}px`,
										}}
									/>
									{isFetching && <TableLoadingRow columns={columns} />}
								</>
							) : isFetching ? (
								<TableLoadingRow columns={columns} />
							) : (
								<TableEmptyRow columns={columns} />
							)}
						</TableBody>
					</Table>
				</Wrapper>
			</ScrollShadowContainer>
		</div>
	);
};

export const LazyInfinityTable = memo(LazyInfinityTableComponent) as typeof LazyInfinityTableComponent;
