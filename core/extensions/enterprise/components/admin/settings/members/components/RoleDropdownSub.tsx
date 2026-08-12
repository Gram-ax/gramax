import { getRoleName, type RoleId } from "@ext/enterprise/components/admin/settings/components/roles/Access";
import type { RoleRules } from "@ext/enterprise/components/admin/settings/members/model/roleRules";
import { WithTooltip } from "@ext/enterprise/components/admin/ui-kit/WithTooltip";
import t from "@ext/localization/locale/translate";
import { DropdownMenuItem, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger } from "@ui-kit/Dropdown";

interface RoleDropdownSubProps {
	rules: RoleRules;
	onChange: (role: RoleId) => void;
}

export const RoleDropdownSub = ({ rules, onChange }: RoleDropdownSubProps) => {
	return (
		<DropdownMenuSub>
			<DropdownMenuSubTrigger>{t("enterprise.admin.roles.role")}</DropdownMenuSubTrigger>
			<DropdownMenuSubContent>
				{rules.roles.map((role) => {
					const reason = rules.disabledReason(role);
					return (
						<WithTooltip key={role} tooltip={reason}>
							<DropdownMenuItem disabled={Boolean(reason)} onSelect={() => onChange(role)}>
								{getRoleName(role)}
							</DropdownMenuItem>
						</WithTooltip>
					);
				})}
			</DropdownMenuSubContent>
		</DropdownMenuSub>
	);
};
