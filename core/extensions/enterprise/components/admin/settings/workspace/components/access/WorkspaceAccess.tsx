import { getRoleName, RoleId } from "@ext/enterprise/components/admin/settings/components/roles/Access";
import { WorkspaceAccessGroup } from "./components/group/WorkspaceAccessGroup";
import { WorkspaceAccessUser } from "./components/users/WorkspaceAccessUser";
import { WorkspaceSettings } from "@ext/enterprise/components/admin/settings/workspace/types/WorkspaceComponent";

interface WorkspaceAccessProps {
	localSettings: WorkspaceSettings;
	setLocalSettings: React.Dispatch<React.SetStateAction<WorkspaceSettings>>;
	ownerRole: RoleId;
	groups: string[];
}

export function WorkspaceAccess({ localSettings, setLocalSettings, ownerRole, groups }: WorkspaceAccessProps) {
	return (
		<div>
			<h2 className="text-xl font-medium">{getRoleName(ownerRole)}</h2>

			<div className="flex flex-row gap-4">
				<div className="flex-1 py-6">
					<WorkspaceAccessGroup
						localSettings={localSettings}
						setLocalSettings={setLocalSettings}
						ownerRole={ownerRole}
						groups={groups}
					/>
				</div>

				<div className="flex-1 py-6">
					<WorkspaceAccessUser
						localSettings={localSettings}
						setLocalSettings={setLocalSettings}
						ownerRole={ownerRole}
					/>
				</div>
			</div>
		</div>
	);
}
