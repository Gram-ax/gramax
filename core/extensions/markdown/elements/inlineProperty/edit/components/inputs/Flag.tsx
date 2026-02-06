import t from "@ext/localization/locale/translate";
import { DropdownMenuRadioGroup, DropdownMenuRadioItem } from "@ui-kit/Dropdown";
import { ChangeEvent as ReactChangeEvent } from "react";

interface FlagProps {
	id: string;
	value: boolean;
	preSubmit: (name: string, value: any, isDelete?: boolean) => void;
	onChange: (event: ReactChangeEvent<HTMLInputElement>) => void;
}

const Flag = ({ value = false, onChange, preSubmit, id }: FlagProps) => {
	const valueString = value.toString();
	const onClick = (value: string) => {
		const syntheticEvent = {
			target: { checked: value === "true" },
			currentTarget: { checked: value === "true" },
		} as ReactChangeEvent<HTMLInputElement>;

		onChange(syntheticEvent);
		preSubmit(id, undefined, value === "false");
	};

	return (
		<DropdownMenuRadioGroup onValueChange={onClick} value={valueString}>
			<DropdownMenuRadioItem value="true">{t("yes")}</DropdownMenuRadioItem>
			<DropdownMenuRadioItem value="false">{t("no")}</DropdownMenuRadioItem>
		</DropdownMenuRadioGroup>
	);
};

export default Flag;
