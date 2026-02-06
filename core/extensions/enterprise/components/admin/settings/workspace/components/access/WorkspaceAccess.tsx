import { getRoleName, RoleId } from "@ext/enterprise/components/admin/settings/components/roles/Access";
import { WorkspaceSettings } from "@ext/enterprise/components/admin/settings/workspace/types/WorkspaceComponent";
import { GroupInfo } from "./components/group/types/GroupTypes";
import { WorkspaceAccessGroup } from "./components/group/WorkspaceAccessGroup";
import { WorkspaceAccessUser } from "./components/users/WorkspaceAccessUser";

interface WorkspaceAccessProps {
	localSettings: WorkspaceSettings;
	setLocalSettings: React.Dispatch<React.SetStateAction<WorkspaceSettings>>;
	ownerRole: RoleId;
	groups: GroupInfo[];
}

export function WorkspaceAccess({ localSettings, setLocalSettings, ownerRole, groups }: WorkspaceAccessProps) {
	return (
		<div>
			<h2 className="text-xl font-medium">{getRoleName(ownerRole)}</h2>

			<div className="flex flex-row gap-4">
				<div className="flex-1 py-6">
					<WorkspaceAccessGroup
						groups={groups}
						localSettings={localSettings}
						ownerRole={ownerRole}
						setLocalSettings={setLocalSettings}
					/>
				</div>

				<div className="flex-1 py-6">
					<WorkspaceAccessUser
						localSettings={localSettings}
						ownerRole={ownerRole}
						setLocalSettings={setLocalSettings}
					/>
				</div>
			</div>
		</div>
	);
}
