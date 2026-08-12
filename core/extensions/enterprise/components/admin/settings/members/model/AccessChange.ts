import type { RoleId } from "@ext/enterprise/components/admin/settings/components/roles/Access";
import type { GroupSource } from "@ext/enterprise/components/admin/settings/workspace/components/access/components/group/types/GroupTypes";

export type AccessChange =
	| { kind: "removeResource"; resourceId: string }
	| { kind: "setResource"; resourceId: string; mainBranch: string | undefined; branchProtected: boolean | undefined }
	| { kind: "setGroupAccess"; groupId: string; source: GroupSource; resourceId: string; role: RoleId }
	| { kind: "removeGroupAccess"; groupId: string; source: GroupSource; resourceId: string }
	| { kind: "setUserAccess"; userId: string; resourceId: string; role: RoleId; branches?: string[] }
	| { kind: "removeUserAccess"; userId: string; resourceId: string }
	| { kind: "createGroup"; groupId: string; groupName: string }
	| { kind: "deleteGroups"; groupIds: string[] }
	| { kind: "setGroupUsers"; groupId: string; emails: string[] }
	| { kind: "setUserGroups"; email: string; groupIds: string[] }
	| { kind: "setEditorSlots"; editors: string[] }
	| { kind: "setGroupWorkspaceOwner"; groupId: string; source: GroupSource; owner: boolean }
	| { kind: "setUserWorkspaceOwner"; userId: string; owner: boolean }
	| { kind: "removeUserEverywhere"; userId: string }
	| { kind: "setGuestAccess"; userId: string; resourceId: string }
	| { kind: "removeGuestAccess"; userId: string; resourceId: string }
	| { kind: "removeGuestEverywhere"; userId: string };
