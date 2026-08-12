import { getRoleName, type RoleId } from "@ext/enterprise/components/admin/settings/components/roles/Access";
import type { RoleRules } from "@ext/enterprise/components/admin/settings/members/model/roleRules";
import { WithTooltip } from "@ext/enterprise/components/admin/ui-kit/WithTooltip";
import t from "@ext/localization/locale/translate";
import { Counter } from "@ui-kit/Counter";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTriggerButton } from "@ui-kit/Dropdown";
import { Icon } from "@ui-kit/Icon";

interface ChangeRoleButtonProps {
	rules: RoleRules;
	count: number;
	onChange: (role: RoleId) => void;
}

export const ChangeRoleButton = (props: ChangeRoleButtonProps) => {
	const { count, onChange, rules } = props;
	if (!count) return null;
	return (
		<DropdownMenu>
			<DropdownMenuTriggerButton className="pl-3 pr-2.5">
				{t("enterprise.admin.roles.change")}
				<Counter className="tabular-nums p-0 min-w-0" variant="text">
					{count}
				</Counter>
				<Icon icon="chevron-down" />
			</DropdownMenuTriggerButton>
			<DropdownMenuContent align="start" className="font-sans font-normal">
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
			</DropdownMenuContent>
		</DropdownMenu>
	);
};
