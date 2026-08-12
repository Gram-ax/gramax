import { InvalidEmailCell } from "@ext/enterprise/components/admin/settings/components/InvalidEmailCell";
import { WorkspaceOwnerBadge } from "@ext/enterprise/components/admin/settings/members/components/WorkspaceOwnerBadge";
import t from "@ext/localization/locale/translate";
import { Badge } from "@ui-kit/Badge";
import type { ColumnDef } from "@ui-kit/DataTable";

export const userColumnId = "user";

export interface UserColumnOptions<T> {
	header?: string;
	getName: (row: T) => string;
	getEmail?: (row: T) => string;
	isEditor?: (row: T) => boolean;
	isWorkspaceOwner?: (row: T) => boolean;
	showBadges?: boolean;
}

export const userColumn = <T,>({
	getName,
	header,
	getEmail,
	isEditor,
	isWorkspaceOwner,
	showBadges,
}: UserColumnOptions<T>): ColumnDef<T> => ({
	id: userColumnId,
	accessorFn: getName,
	header: header ?? t("email"),
	cell: ({ row }) => {
		const item = row.original;

		const label = getName(item);
		const email = getEmail?.(item);

		return (
			<div className="flex items-center gap-1.5 whitespace-nowrap">
				<InvalidEmailCell value={email ?? label} />
				{email && email !== label && <span className="text-muted-foreground">{label}</span>}
				{showBadges && <UserBadges isEditor={isEditor?.(item)} isWorkspaceOwner={isWorkspaceOwner?.(item)} />}
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
