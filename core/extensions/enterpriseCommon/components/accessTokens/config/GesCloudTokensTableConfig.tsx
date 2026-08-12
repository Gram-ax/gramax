import DateComponent from "@components/Atoms/Date";
import t from "@ext/localization/locale/translate";
import { Checkbox } from "@ui-kit/Checkbox";
import type { ColumnDef } from "@ui-kit/DataTable";
import { TABLE_SELECT_COLUMN_CODE } from "../../../../enterprise/components/admin/ui-kit/table/TableComponent";
import type { AccessTokenItem } from "../types/AccessTokensComponentTypes";

export const getGesCloudTokensTableColumns: () => ColumnDef<AccessTokenItem>[] = () => [
	{
		id: TABLE_SELECT_COLUMN_CODE,
		header: ({ table }) => {
			const rows = table.getRowModel().rows;
			const allSelected = rows.length && rows.every((row) => row.getIsSelected());
			const someSelected = rows.some((row) => row.getIsSelected());
			const headerCheckedState = allSelected ? true : someSelected ? "indeterminate" : false;

			return (
				<Checkbox
					aria-label="Select all"
					checked={headerCheckedState}
					onCheckedChange={(value) =>
						rows.forEach((row) => {
							row.toggleSelected(!!value);
						})
					}
				/>
			);
		},
		cell: ({ row }) => (
			<Checkbox
				aria-label="Select row"
				checked={row.getIsSelected()}
				onCheckedChange={(value) => row.toggleSelected(!!value)}
			/>
		),
		enableSorting: false,
		enableHiding: false,
	},
	{
		accessorKey: "name",
		header: t("enterprise-cloud.org-settings.tokens.name"),
		cell: ({ row }) => <span>{row.original.name}</span>,
	},
	{
		accessorKey: "createdAt",
		header: t("enterprise-cloud.org-settings.tokens.created-at"),
		cell: ({ row }) => <DateComponent date={new Date(row.original.createdAt)} />,
	},
	{
		accessorKey: "expiresAt",
		header: t("enterprise-cloud.org-settings.tokens.expires-at"),
		cell: ({ row }) => {
			const [year, month, day] = row.original.expiresAt.split("-").map(Number);
			const date = new Date(year, month - 1, day, 0, 0, 0, 0);
			return <DateComponent date={date} />;
		},
	},
];
