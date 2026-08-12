import { InvalidEmailCell } from "@ext/enterprise/components/admin/settings/components/InvalidEmailCell";
import t from "@ext/localization/locale/translate";
import { Checkbox } from "@ui-kit/Checkbox";
import type { ColumnDef } from "@ui-kit/DataTable";
import { TABLE_SELECT_COLUMN_CODE } from "../../../../../../enterprise/components/admin/ui-kit/table/TableComponent";
import type { GesCloudMember } from "../types/GesCloudUsersComponentTypes";

export const getGesCloudUsersTableColumns: () => ColumnDef<GesCloudMember>[] = () => [
	{
		id: TABLE_SELECT_COLUMN_CODE,
		size: 40,
		header: ({ table }) => {
			const changeableRows = table
				.getRowModel()
				.rows.filter((row) => row.original.type === "invite" || !row.original.isOwner);

			const allChangeableSelected = changeableRows.length && changeableRows.every((row) => row.getIsSelected());
			const someChangeableSelected = changeableRows.some((row) => row.getIsSelected());

			const headerCheckedState = allChangeableSelected ? true : someChangeableSelected ? "indeterminate" : false;

			return (
				<Checkbox
					aria-label="Select all"
					checked={headerCheckedState}
					onCheckedChange={(value) =>
						changeableRows.forEach((row) => {
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
				disabled={row.original.type === "user" && row.original.isOwner}
				onCheckedChange={(value) => row.toggleSelected(!!value)}
			/>
		),
		enableSorting: false,
		enableHiding: false,
	},
	{
		accessorKey: "email",
		header: t("enterprise-cloud.org-settings.users.email"),
		cell: ({ row }) => <InvalidEmailCell value={row.original.email} />,
	},
	{
		accessorKey: "type",
		header: t("enterprise-cloud.org-settings.users.status-header"),
		cell: ({ row }) => {
			const type = row.original.type;
			return (
				<span>
					{type === "user"
						? t("enterprise-cloud.org-settings.users.status.user")
						: t("enterprise-cloud.org-settings.users.status.invite")}
				</span>
			);
		},
	},
];
