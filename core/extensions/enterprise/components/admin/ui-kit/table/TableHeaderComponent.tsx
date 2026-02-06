import { cn } from "@core-ui/utils/cn";
import { flexRender, Table as ReactTable } from "@ui-kit/DataTable";
import { TableHead, TableHeader, TableRow } from "@ui-kit/Table";
import { columnThClassName, TABLE_COLUMN_CODE_DEFAULT } from "./TableComponent";

type TableHeaderComponentProps<T> = {
	table: ReactTable<T>;
};

export const TableHeaderComponent = <T,>({ table }: TableHeaderComponentProps<T>) => {
	return (
		<TableHeader>
			{table.getHeaderGroups().map((headerGroup) => (
				<TableRow key={headerGroup.id}>
					{headerGroup.headers.map((header, idx) => {
						return (
							<TableHead
								className={cn(
									columnThClassName[header.column.id as keyof typeof columnThClassName] ||
										columnThClassName[TABLE_COLUMN_CODE_DEFAULT],
									idx === 0 ? " pl-3" : "",
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
	);
};
