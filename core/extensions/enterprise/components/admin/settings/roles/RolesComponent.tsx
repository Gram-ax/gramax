import { useScrollShadow } from "@ext/enterprise/components/admin/hooks/useScrollShadow";
import type { ALL_ROLES } from "@ext/enterprise/components/admin/settings/components/roles/Access";
import RoleComponent from "@ext/enterprise/components/admin/settings/roles/RoleComponent";
import { StickyHeader } from "@ext/enterprise/components/admin/ui-kit/StickyHeader";
import { TabInitialLoader } from "@ext/enterprise/components/admin/ui-kit/TabInitialLoader";
import { Page } from "@ext/enterprise/types/EnterpriseAdmin";
import { getAdminPageTitle } from "@ext/enterprise/utils/getAdminPageTitle";
import t from "@ext/localization/locale/translate";
import { ALL_PERMISSIONS, type PermissionType } from "@ext/security/logic/Permission/Permissions";
import { Button, LoadingButtonTemplate } from "@ui-kit/Button";
import { Icon } from "@ui-kit/Icon";
import { useEffect, useRef, useState } from "react";

export interface RolePermissions {
	allowedPermissions: PermissionType[];
	deniedPermissions: PermissionType[];
}

export type RolesType = (typeof ALL_ROLES)[number];

const GET_INITIAL_ROLES_PERMISSIONS = (): Record<RolesType, RolePermissions> => {
	return {
		reader: {
			allowedPermissions: ["ReadCatalogContent", "CloneCatalogContent"],
			deniedPermissions: [],
		},

		reviewer: {
			allowedPermissions: ["ReadCatalogContent", "CloneCatalogContent", "EditCatalogContent"],
			deniedPermissions: [],
		},

		editor: {
			allowedPermissions: [
				"ReadCatalogContent",
				"CloneCatalogContent",
				"EditCatalogContent",
				"EditCatalog",
				"ReadWorkspace",
			],
			deniedPermissions: [],
		},

		catalogOwner: {
			allowedPermissions: [
				"ReadCatalogContent",
				"CloneCatalogContent",
				"EditCatalogContent",
				"EditCatalog",
				"ReadWorkspace",
				"ConfigureCatalog",
			],
			deniedPermissions: [],
		},

		workspaceOwner: {
			allowedPermissions: [
				"ReadCatalogContent",
				"CloneCatalogContent",
				"EditCatalogContent",
				"EditCatalog",
				"ReadWorkspace",
				"ConfigureCatalog",
				"ConfigureWorkspace",
			],
			deniedPermissions: [],
		},
	};
};

const RolesComponent = () => {
	const [isSaving, setIsSaving] = useState(false);
	const [hasChanges, setHasChanges] = useState(false);
	const { isScrolled } = useScrollShadow();

	const [initialRolesPermissions, setInitialRolesPermissions] =
		useState<Record<RolesType, RolePermissions>>(undefined);
	const [allPermissions, setAllPermissions] = useState<PermissionType[]>(undefined);
	const resultRolesPermissions = useRef<Record<string, RolePermissions>>({});

	const handleSave = () => {
		setIsSaving(true);
		alert(JSON.stringify(resultRolesPermissions.current, null, 2));
		setIsSaving(false);
	};

	useEffect(() => {
		setInitialRolesPermissions(GET_INITIAL_ROLES_PERMISSIONS());
		setAllPermissions(ALL_PERMISSIONS.map((permission) => permission));
	}, []);

	if (initialRolesPermissions === undefined || allPermissions === undefined) return <TabInitialLoader />;

	return (
		<>
			<StickyHeader
				actions={
					<>
						{isSaving ? (
							<LoadingButtonTemplate text={`${t("save2")}...`} />
						) : (
							<Button disabled={!hasChanges} onClick={handleSave}>
								<Icon icon="save" />
								{t("save")}
							</Button>
						)}
					</>
				}
				isScrolled={isScrolled}
				title={<>{getAdminPageTitle(Page.ROLES)}</>}
			/>
			<div className="flex flex-col gap-6">
				{Object.entries(initialRolesPermissions).map(([role, rolePermissions]) => (
					<RoleComponent
						allPermissions={allPermissions}
						key={role}
						onChange={(permissions) => {
							resultRolesPermissions.current[role] = permissions;
							setHasChanges(Object.keys(resultRolesPermissions.current).length > 0);
						}}
						role={role}
						rolePermissions={rolePermissions}
					/>
				))}
			</div>
		</>
	);
};

export default RolesComponent;
