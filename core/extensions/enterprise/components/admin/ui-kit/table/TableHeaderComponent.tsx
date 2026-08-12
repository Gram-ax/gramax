import { cn } from "@core-ui/utils/cn";
import { flexRender, type Table as ReactTable } from "@ui-kit/DataTable";
import { Icon } from "@ui-kit/Icon";
import { TableHead, TableHeader, TableRow } from "@ui-kit/Table";
import { columnWidthStyle } from "./columnWidthStyle";

type TableHeaderComponentProps<T> = {
	table: ReactTable<T>;
	sortable?: boolean;
	className?: string;
};

export const TableHeaderComponent = <T,>({ table, sortable, className }: TableHeaderComponentProps<T>) => {
	return (
		<TableHeader className={className}>
			{table.getHeaderGroups().map((headerGroup) => (
				<TableRow className="hover:bg-transparent" key={headerGroup.id}>
					{headerGroup.headers.map((header) => {
						const colSize = header.column.columnDef.size;
						const canSort = sortable && header.column.getCanSort();
						const sorted = header.column.getIsSorted();
						const content = header.isPlaceholder
							? null
							: flexRender(header.column.columnDef.header, header.getContext());
						return (
							<TableHead className="px-3" key={header.id} style={columnWidthStyle(colSize)}>
								{canSort ? (
									<button
										className="flex select-none items-center gap-1"
										onClick={header.column.getToggleSortingHandler()}
										type="button"
									>
										{content}
										<Icon
											className={cn("text-muted", !sorted && "opacity-40")}
											icon={
												sorted === "asc"
													? "arrow-up"
													: sorted === "desc"
														? "arrow-down"
														: "arrow-up-down"
											}
											size="sm"
										/>
									</button>
								) : (
									content
								)}
							</TableHead>
						);
					})}
				</TableRow>
			))}
		</TableHeader>
	);
};
