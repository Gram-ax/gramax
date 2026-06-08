import t from "@ext/localization/locale/translate";
import { DropdownMenuRadioGroup, DropdownMenuRadioItem } from "@ui-kit/Dropdown";
import type { ChangeEvent as ReactChangeEvent } from "react";

interface FlagProps {
	id: string;
	value: boolean;
	preSubmit: (name: string, value: unknown, isDelete?: boolean) => void;
	onChange?: (event: ReactChangeEvent<HTMLInputElement>) => void;
}

const Flag = ({ value = false, onChange, preSubmit, id }: FlagProps) => {
	const valueString = value.toString();
	const onClick = (clicked: string) => {
		const isChecked = clicked === "true";
		const syntheticEvent = {
			target: { checked: isChecked },
			currentTarget: { checked: isChecked },
		} as ReactChangeEvent<HTMLInputElement>;

		onChange?.(syntheticEvent);
		if (isChecked && value) return;
		preSubmit(id, undefined, !isChecked);
	};

	return (
		<DropdownMenuRadioGroup onValueChange={onClick} value={valueString}>
			<DropdownMenuRadioItem value="true">{t("yes")}</DropdownMenuRadioItem>
			<DropdownMenuRadioItem value="false">{t("no")}</DropdownMenuRadioItem>
		</DropdownMenuRadioGroup>
	);
};

export default Flag;
