import { WorkspaceOwnerBadge } from "@ext/enterprise/components/admin/settings/members/components/WorkspaceOwnerBadge";
import t from "@ext/localization/locale/translate";
import { Badge } from "@ui-kit/Badge";
import type { ColumnDef } from "@ui-kit/DataTable";

export const userBadgesColumnId = "userBadges";

export interface UserBadgesColumnOptions<T> {
	header?: string;
	isEditor?: (row: T) => boolean;
	isWorkspaceOwner?: (row: T) => boolean;
}

export const userBadgesColumn = <T,>({
	header,
	isEditor,
	isWorkspaceOwner,
}: UserBadgesColumnOptions<T>): ColumnDef<T> => ({
	id: userBadgesColumnId,
	header: header ?? "",
	cell: ({ row }) => {
		const item = row.original;

		return (
			<div className="flex items-center gap-1.5 whitespace-nowrap">
				{<UserBadges isEditor={isEditor?.(item)} isWorkspaceOwner={isWorkspaceOwner?.(item)} />}
			</div>
		);
	},
});

interface MemberBadgesProps {
	isEditor?: boolean;
	isWorkspaceOwner?: boolean;
}

const UserBadges = ({ isEditor, isWorkspaceOwner }: MemberBadgesProps) => (
	<>
		{isEditor && (
			<Badge focus="low" size="sm">
				{t("enterprise.admin.users.editor")}
			</Badge>
		)}
		{isWorkspaceOwner && <WorkspaceOwnerBadge />}
	</>
);
