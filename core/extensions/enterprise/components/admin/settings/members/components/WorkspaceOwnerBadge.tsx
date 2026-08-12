import { getRoleName } from "@ext/enterprise/components/admin/settings/components/roles/Access";
import { Badge } from "@ui-kit/Badge";

export const WorkspaceOwnerBadge = () => (
	<Badge focus="low" size="sm" startIcon="crown">
		{getRoleName("workspaceOwner")}
	</Badge>
);
