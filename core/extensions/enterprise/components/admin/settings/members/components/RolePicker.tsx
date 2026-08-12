import { cn } from "@core-ui/utils/cn";
import { getRoleName, type RoleId } from "@ext/enterprise/components/admin/settings/components/roles/Access";
import {
	isMixedRole,
	MIXED_ROLE,
	type RoleRules,
	type RoleValue,
} from "@ext/enterprise/components/admin/settings/members/model/roleRules";
import { WithTooltip } from "@ext/enterprise/components/admin/ui-kit/WithTooltip";
import t from "@ext/localization/locale/translate";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@ui-kit/Select";

interface RolePickerProps {
	value: RoleValue | undefined;
	rules: RoleRules;
	onChange: (role: RoleId) => void;
	disabled?: boolean;
	className?: string;
}

export const RolePicker = ({ value, rules, onChange, disabled, className }: RolePickerProps) => {
	const showMixed = isMixedRole(value);
	const isDisabled = disabled || rules.locked;

	return (
		<WithTooltip
			className={className}
			tooltip={rules.locked ? t("enterprise.admin.guests.reader-only-hint") : undefined}
		>
			<Select disabled={isDisabled} onValueChange={(v) => onChange(v as RoleId)} value={value ?? ""}>
				<SelectTrigger className={cn(className, isDisabled && "text-muted")}>
					<SelectValue placeholder={t("enterprise.admin.roles.select")}>
						{showMixed ? t("enterprise.admin.mixed") : value ? getRoleName(value as RoleId) : undefined}
					</SelectValue>
				</SelectTrigger>
				<SelectContent>
					<SelectGroup>
						{showMixed && (
							<SelectItem disabled value={MIXED_ROLE}>
								{t("enterprise.admin.mixed")}
							</SelectItem>
						)}
						{rules.roles.map((role) => {
							const reason = rules.disabledReason(role);
							return (
								<WithTooltip key={role} tooltip={reason}>
									<SelectItem disabled={Boolean(reason)} value={role}>
										{getRoleName(role)}
									</SelectItem>
								</WithTooltip>
							);
						})}
					</SelectGroup>
				</SelectContent>
			</Select>
		</WithTooltip>
	);
};
