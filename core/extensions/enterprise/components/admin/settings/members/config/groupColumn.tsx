import { GroupTypeBadge } from "@ext/enterprise/components/admin/settings/components/GroupTypeBadge";
import { WorkspaceOwnerBadge } from "@ext/enterprise/components/admin/settings/members/components/WorkspaceOwnerBadge";
import type { GroupSource } from "@ext/enterprise/components/admin/settings/workspace/components/access/components/group/types/GroupTypes";
import t from "@ext/localization/locale/translate";
import type { ColumnDef } from "@ui-kit/DataTable";

export const groupColumnId = "group";

export interface GroupColumnOptions<T> {
	header?: string;
	getLabel: (row: T) => string;
	getId: (row: T) => string;
	getSource?: (row: T) => GroupSource;
	isWorkspaceOwner?: (row: T) => boolean;
}

export const groupColumn = <T,>(opts: GroupColumnOptions<T>): ColumnDef<T> => ({
	id: groupColumnId,
	accessorFn: opts.getLabel,
	header: opts.header ?? t("name"),
	cell: ({ row }) => {
		const item = row.original;

		const label = opts.getLabel(item);

		return (
			<div className="flex items-center gap-1.5">
				<span>{label}</span>
				{opts.getSource && <GroupTypeBadge group={{ id: opts.getId(item), source: opts.getSource(item) }} />}
				{opts.isWorkspaceOwner?.(item) && <WorkspaceOwnerBadge />}
			</div>
		);
	},
});
