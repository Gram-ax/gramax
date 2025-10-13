import ValueHandler from "@ext/properties/components/Helpers/ValueHandler";
import { memo, useCallback } from "react";
import t from "@ext/localization/locale/translate";
import { DropdownMenuItem, DropdownMenuSeparator } from "@ui-kit/Dropdown";
import Icon from "@components/Atoms/Icon";

interface MenuProps {
	name: string;
	data: string[];
	defaultData: string[];
	updateData: (name: string, value?: string | string[]) => void;
}

const Menu = memo(({ name, data, defaultData, updateData }: MenuProps) => {
	const onChange = useCallback((values: string[]) => updateData(name, values), [updateData, name]);

	const deleteHandler = useCallback(
		(e: Event) => {
			e.preventDefault();
			if (defaultData === data) return;
			updateData(name);
		},
		[updateData, name, defaultData, data],
	);

	return (
		<>
			<DropdownMenuItem onSelect={deleteHandler}>
				<Icon code="rotate-ccw" />
				{t("reset")}
			</DropdownMenuItem>
			<DropdownMenuSeparator />
			<ValueHandler data={data} onChange={onChange} />
		</>
	);
});

export default Menu;
