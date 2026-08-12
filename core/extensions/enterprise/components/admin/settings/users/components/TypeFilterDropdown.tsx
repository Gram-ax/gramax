import type { FilterTypeOption } from "@ext/enterprise/components/admin/settings/users/hooks/useUserList";
import t from "@ext/localization/locale/translate";
import { Icon } from "@ui-kit/Icon";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@ui-kit/Select";

type TypeFilterValue<T extends FilterTypeOption = FilterTypeOption> = T | null;

interface TypeFilterDropdownProps<T extends FilterTypeOption> {
	selectedType: TypeFilterValue<T>;
	onSelectType: (value: TypeFilterValue<T>) => void;
	types?: readonly T[];
}

export const TypeFilterDropdown = <T extends FilterTypeOption = FilterTypeOption>(
	props: TypeFilterDropdownProps<T>,
) => {
	const { selectedType, onSelectType, types = ["editor", "owner"] } = props;

	const typeLabels: Record<FilterTypeOption, string> = {
		editor: t("enterprise.admin.users.editors"),
		owner: t("enterprise.admin.roles.workspaceOwners"),
	};

	return (
		<Select
			onValueChange={(x) => {
				onSelectType(x === "all" ? null : (x as TypeFilterValue<T>));
			}}
			value={selectedType ?? "all"}
		>
			<SelectTrigger className="w-auto min-w-0 gap-2">
				<Icon icon="filter" />
				{selectedType ? typeLabels[selectedType] : t("enterprise.admin.all")}
			</SelectTrigger>
			<SelectContent className="font-sans font-normal">
				<SelectItem value="all">{t("enterprise.admin.all")}</SelectItem>
				{types.map((type) => (
					<SelectItem key={type} value={type}>
						{typeLabels[type]}
					</SelectItem>
				))}
			</SelectContent>
		</Select>
	);
};
