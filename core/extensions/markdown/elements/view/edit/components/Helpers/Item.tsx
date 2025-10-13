import t from "@ext/localization/locale/translate";
import PropertyButtons from "@ext/properties/components/Helpers/PropertyButtons";
import { Checkbox } from "@ui-kit/Checkbox";
import {
	DropdownMenuCheckboxItem,
	DropdownMenuItem,
	DropdownMenuRadioItem,
	DropdownMenuSub,
	DropdownMenuSubContent,
	DropdownMenuSubTrigger,
} from "@ui-kit/Dropdown";
import { MouseEvent, ReactNode, useMemo } from "react";
import { Mode } from "@ext/markdown/elements/view/edit/components/Helpers/AddFilter";

interface ItemProps {
	name: string;
	trigger: ReactNode;
	selected?: boolean;
	value?: string[];
	values?: string[];
	mode?: Mode;
	ignoreEmpty?: boolean;
	buttons?: ReactNode;
	onClick: (value?: string | string[]) => void;
	renderer?: () => ReactNode;
}

const getCheckedState = (values: string[], selected: string[]) => {
	const selectedCount = selected?.length;
	const valuesCount = values?.length + 1;
	if (selectedCount && selectedCount === valuesCount) return false;
	if (selectedCount && valuesCount !== selectedCount) return "indeterminate";
	return true;
};

const Item = ({ values, onClick, renderer, trigger, selected, value, name, mode, ignoreEmpty, buttons }: ItemProps) => {
	const rendererChildren = useMemo(() => renderer && renderer(), [renderer]);
	const isSelected = useMemo(() => {
		if (!selected && !value) return false;
		if (value?.length) return true;
		if (selected) return true;
		return false;
	}, [selected, value]);

	if (!values && !rendererChildren && !ignoreEmpty) {
		if (mode === "multiple") {
			return (
				<DropdownMenuItem
					onSelect={(event) => {
						event.preventDefault();
						onClick(ignoreEmpty ? name : undefined);
					}}
				>
					<Checkbox checked={isSelected} />
					{trigger}
				</DropdownMenuItem>
			);
		}

		return <DropdownMenuRadioItem value={name}>{trigger}</DropdownMenuRadioItem>;
	}

	const onCheckAll = (e: MouseEvent<HTMLDivElement> | Event) => {
		e.preventDefault();
		onClick("all");
	};

	const onEmptyClick = (e: Event) => {
		e.preventDefault();
		onClick("none");
	};

	return (
		<DropdownMenuSub>
			<DropdownMenuSubTrigger onClick={onCheckAll}>
				<Checkbox checked={isSelected} />
				{trigger}
			</DropdownMenuSubTrigger>
			<DropdownMenuSubContent>
				{(values?.length || ignoreEmpty) && (
					<>
						<DropdownMenuCheckboxItem checked={getCheckedState(values, value)} onSelect={onCheckAll}>
							{t("properties.select-all")}
						</DropdownMenuCheckboxItem>
						<DropdownMenuCheckboxItem onSelect={onEmptyClick} checked={!value?.includes("none")}>
							{t("properties.empty")}
						</DropdownMenuCheckboxItem>
						{buttons}
						<PropertyButtons
							name={name}
							values={values}
							type={mode === "single" ? "radio" : "checkbox"}
							value={value}
							onChange={onClick}
							options={{
								closeOnSelect: true,
								invertChecked: true,
							}}
						/>
					</>
				)}
				{!values?.length && rendererChildren}
			</DropdownMenuSubContent>
		</DropdownMenuSub>
	);
};

export default Item;
