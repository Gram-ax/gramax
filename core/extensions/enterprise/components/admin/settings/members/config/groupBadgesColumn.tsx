import { GroupTypeBadge } from "@ext/enterprise/components/admin/settings/components/GroupTypeBadge";
import { WorkspaceOwnerBadge } from "@ext/enterprise/components/admin/settings/members/components/WorkspaceOwnerBadge";
import type { GroupSource } from "@ext/enterprise/components/admin/settings/workspace/components/access/components/group/types/GroupTypes";
import { getGroupBadgeType } from "@ext/enterprise/components/admin/settings/workspace/components/access/components/group/utils/groupUtils";
import type { ColumnDef } from "@ui-kit/DataTable";

export const groupBadgesColumnId = "groupBadges";

const shouldShowBadge = <T,>(item: T, opts: GroupBadgesColumnOptions<T>): boolean => {
	if (!opts.getSource) return true;
	const badgeType = getGroupBadgeType({ id: opts.getId(item), source: opts.getSource(item) });
	return badgeType !== "custom";
};

export interface GroupBadgesColumnOptions<T> {
	header?: string;
	getId: (row: T) => string;
	getSource?: (row: T) => GroupSource;
	isWorkspaceOwner?: (row: T) => boolean;
}

export const groupBadgesColumn = <T,>(opts: GroupBadgesColumnOptions<T>): ColumnDef<T> => ({
	id: groupBadgesColumnId,
	header: opts.header ?? "",
	cell: ({ row }) => {
		const item = row.original;
		const showBadge = shouldShowBadge(item, opts);
		return (
			<div className="flex items-center gap-1.5">
				{showBadge && <GroupTypeBadge group={{ id: opts.getId(item), source: opts.getSource?.(item) }} />}
				{opts.isWorkspaceOwner?.(item) && <WorkspaceOwnerBadge />}
			</div>
		);
	},
});
