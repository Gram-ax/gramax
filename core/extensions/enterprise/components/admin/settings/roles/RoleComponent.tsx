import { classNames } from "@components/libs/classNames";
import styled from "@emotion/styled";
import type { RolePermissions } from "@ext/enterprise/components/admin/settings/roles/RolesComponent";
import { StyledField } from "@ext/enterprise/components/admin/ui-kit/StyledField";
import type { PermissionType } from "@ext/security/logic/Permission/Permissions";
import { MultiSelect } from "@ui-kit/MultiSelect";
import { useState } from "react";

interface RoleComponentProps {
	role: string;
	rolePermissions: RolePermissions;
	allPermissions: PermissionType[];
	className?: string;
	onChange: (permissions: RolePermissions) => void;
}

const getRoleAvailablePermissions = (
	type: "allow" | "deny",
	rolePermissions: RolePermissions,
	allPermissions: PermissionType[],
): PermissionType[] => {
	return allPermissions.filter((permission) => {
		if (type === "allow") {
			return !rolePermissions.deniedPermissions.includes(permission);
		}
		return !rolePermissions.allowedPermissions.includes(permission);
	});
};

const RoleComponent = (props: RoleComponentProps) => {
	const { role, rolePermissions, allPermissions, className, onChange } = props;
	const [permissions, setPermissions] = useState<RolePermissions>(rolePermissions);

	const setPermissionsWrapper = (permissions: RolePermissions) => {
		setPermissions(permissions);
		onChange(permissions);
	};

	const allowAvaliablePermissions = getRoleAvailablePermissions("allow", permissions, allPermissions);
	const denyAvaliablePermissions = getRoleAvailablePermissions("deny", permissions, allPermissions);

	return (
		<div className={classNames(className, {}, ["px-6 space-y-6"])}>
			<div className="border rounded-lg p-4 bg-background">
				<h3 className="font-medium text-foreground mb-3">{role}</h3>
				<div className="flex flex-col gap-3">
					<StyledField
						control={() => (
							<MultiSelect
								className="multi-select-allowed"
								defaultValue={permissions.allowedPermissions.map((permission) => ({
									value: permission,
									label: permission,
								}))}
								loadOptions={async ({ searchQuery }) => ({
									options: allowAvaliablePermissions
										.filter((permission) =>
											permission.toLowerCase().includes(searchQuery.toLowerCase()),
										)
										.map((permission) => ({
											value: permission,
											label: permission,
										})),
								})}
								onChange={(value) => {
									setPermissionsWrapper({
										...permissions,
										allowedPermissions: value.map((v) => v.value),
									});
								}}
							/>
						)}
						title="Allowed"
					/>
					<StyledField
						control={() => (
							<MultiSelect
								className="multi-select-denied"
								defaultValue={permissions.deniedPermissions.map((permission) => ({
									value: permission,
									label: permission,
								}))}
								loadOptions={async ({ searchQuery }) => ({
									options: denyAvaliablePermissions
										.filter((permission) =>
											permission.toLowerCase().includes(searchQuery.toLowerCase()),
										)
										.map((permission) => ({
											value: permission,
											label: permission,
										})),
								})}
								onChange={(value) => {
									setPermissionsWrapper({
										...permissions,
										deniedPermissions: value.map((v) => v.value),
									});
								}}
							/>
						)}
						title="Denied"
					/>
				</div>
			</div>
		</div>
	);
};

export default styled(RoleComponent)`
	.multi-select-allowed > button > div > * {
		> span {
			color: hsl(var(--status-success)) !important;
			background-color: hsl(var(--status-success-bg));
			border-color: hsl(var(--status-success-border));

			:hover {
				background-color: hsl(var(--status-success-bg-hover));
			}
		}

		> :nth-child(2) {
			background-color: hsl(var(--status-success-border));
		}
	}

	.multi-select-denied > button > div > * {
		> span {
			color: hsl(var(--status-error)) !important;
			background-color: hsl(var(--status-error-bg));
			border-color: hsl(var(--status-error-border));

			:hover {
				background-color: hsl(var(--status-error-bg-hover));
			}
		}

		> :nth-child(2) {
			background-color: hsl(var(--status-error-border));
		}
	}
`;
