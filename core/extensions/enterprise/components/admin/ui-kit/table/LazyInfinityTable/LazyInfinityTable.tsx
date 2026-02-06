import { cn } from "@core-ui/utils/cn";
import styled from "@emotion/styled";
import {
	columnThClassName,
	TABLE_COLUMN_CODE_DEFAULT,
	type TableComponentProps,
} from "@ext/enterprise/components/admin/ui-kit/table/TableComponent";
import { TableEmptyRow } from "@ext/enterprise/components/admin/ui-kit/table/TableEmptyRow";
import { TableLoadingRow } from "@ext/enterprise/components/admin/ui-kit/table/TableLoadingRow";
import { useVirtualizer } from "@tanstack/react-virtual";
import { flexRender } from "@ui-kit/DataTable";
import { ScrollShadowContainer } from "@ui-kit/ScrollShadowContainer";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@ui-kit/Table";
import {
	type DependencyList,
	type Dispatch,
	memo,
	type SetStateAction,
	useCallback,
	useEffect,
	useRef,
	useState,
} from "react";
import { renderRow } from "./renderRow";

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
	selectedRowIds?: number[];
	selectedRowId?: string | null;
	responsive?: boolean;
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
	const {
		loadOptions,
		table,
		columns,
		onRowClick,
		hasMore,
		setData,
		deps,
		selectedRowIds = [],
		selectedRowId,
		responsive = true,
	} = props;
	const scrollContainerRef = useRef<HTMLDivElement>(null);
	const [isFetching, setIsFetching] = useState(false);
	const isInitialLoadComplete = useRef(false);
	const lastScrollTop = useRef(0);

	const depsRef = useRef(deps);
	const isFetchingRef = useRef(false);

	useEffect(() => {
		// Check if deps actually changed
		const depsChanged = deps.some((dep, i) => !Object.is(dep, depsRef.current[i]));
		if (depsChanged) {
			depsRef.current = deps;
			isInitialLoadComplete.current = false;
			isFetchingRef.current = false;
			setIsFetching(false);
			lastScrollTop.current = 0;
			setData([]);
		}
		// biome-ignore lint/correctness/useExhaustiveDependencies: deps is a dynamic array passed as prop
	}, deps);

	// biome-ignore lint/correctness/useExhaustiveDependencies: setData is stable callback from props
	useEffect(() => {
		if (isInitialLoadComplete.current || isFetchingRef.current) return;

		const loadInitialData = async () => {
			if (isInitialLoadComplete.current || isFetchingRef.current || !hasMore) return;

			isFetchingRef.current = true;
			setIsFetching(true);

			try {
				const newData = await loadOptions();

				if (newData.data.length > 0) {
					setData((prevData) => [...prevData, ...newData.data]);
				}

				if (!newData.has_more) {
					isInitialLoadComplete.current = true;
				}
			} catch (error) {
				console.error("Error loading initial data:", error);
			} finally {
				setIsFetching(false);
				isFetchingRef.current = false;
				// Mark as complete after first load - scroll will trigger more
				isInitialLoadComplete.current = true;
			}
		};

		loadInitialData();
	}, [loadOptions, hasMore]);

	const fetchMoreOnBottomReached = useCallback(async () => {
		if (!isInitialLoadComplete.current || isFetchingRef.current) return;

		const scrollContainer = scrollContainerRef.current;
		if (!scrollContainer) return;

		const canLoadMore = hasMore;
		if (!canLoadMore) return;

		const { scrollHeight, scrollTop, clientHeight } = scrollContainer;
		lastScrollTop.current = scrollTop;

		if (scrollTop + clientHeight >= scrollHeight - clientHeight * 0.2) {
			isFetchingRef.current = true;
			setIsFetching(true);

			const scrollHeightBefore = scrollHeight;
			const scrollTopBefore = scrollTop;

			const newData = await loadOptions();
			setData((prevData) => [...prevData, ...newData.data]);

			if (!newData.has_more) {
				setIsFetching(false);
				isFetchingRef.current = false;
				return;
			}

			requestAnimationFrame(() => {
				if (scrollContainer && scrollContainerRef.current) {
					const scrollHeightAfter = scrollContainer.scrollHeight;
					const heightDiff = scrollHeightAfter - scrollHeightBefore;

					if (heightDiff > 0) scrollContainer.scrollTop = scrollTopBefore;
				}
			});

			setIsFetching(false);
			isFetchingRef.current = false;
		}
	}, [loadOptions, setData, hasMore]);

	const { rows } = table.getRowModel();

	const rowVirtualizer = useVirtualizer({
		count: rows.length,
		estimateSize: () => 40,
		getScrollElement: () => scrollContainerRef.current,
		overscan: 10,
	});

	return (
		<div className="relative overflow-hidden flex flex-col max-h-full h-full ">
			<ScrollShadowContainer
				className="flex-1 overflow-y-auto max-h-full border rounded-md"
				onScrollCapture={() => fetchMoreOnBottomReached()}
				ref={scrollContainerRef}
				shadowTopClassName="mt-10"
			>
				<Wrapper>
					<Table className={cn("min-w-full", !responsive && "w-auto")} style={{ tableLayout: "fixed" }}>
						<colgroup>
							{columns.map((col) => {
								const size = col.size;
								return <col key={col.id} style={size ? { width: `${size}px` } : undefined} />;
							})}
						</colgroup>
						<TableHeader className="h-10 bg-secondary-bg top-0 z-10">
							{table.getHeaderGroups().map((headerGroup) => (
								<TableRow className="h-10 items-center" key={headerGroup.id}>
									{headerGroup.headers.map((header, idx) => {
										return (
											<TableHead
												className={cn(
													columnThClassName[
														header.column.id as keyof typeof columnThClassName
													] || columnThClassName[TABLE_COLUMN_CODE_DEFAULT],
													idx === 0 ? "pl-3" : "",
													"h-10 items-center whitespace-nowrap",
												)}
												key={header.id}
											>
												{header.isPlaceholder
													? null
													: flexRender(header.column.columnDef.header, header.getContext())}
											</TableHead>
										);
									})}
								</TableRow>
							))}
						</TableHeader>
						<TableBody>
							{table.getRowModel().rows?.length ? (
								<>
									<tr style={{ height: `${rowVirtualizer.getVirtualItems()[0]?.start ?? 0}px` }} />
									{rowVirtualizer.getVirtualItems().map((virtualRow) =>
										renderRow({
											virtualRow,
											rows,
											onRowClick,
											selectedRowIds,
											selectedRowId,
										}),
									)}
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
									{hasMore && isFetching && <TableLoadingRow columns={columns} />}
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
