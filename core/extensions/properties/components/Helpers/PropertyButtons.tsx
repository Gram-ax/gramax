import { DropdownMenuCheckboxItem, DropdownMenuRadioGroup, DropdownMenuRadioItem } from "@ui-kit/Dropdown";
import t, { hasTranslation, TranslationKey } from "@ext/localization/locale/translate";

type InputType = "radio" | "checkbox";

interface PropertyButtonOptions {
	closeOnSelect?: boolean;
	invertChecked?: boolean;
}

interface PropertyButtonsProps {
	name: string;
	type: InputType;
	values: string[];
	value: string[] | boolean;
	options?: PropertyButtonOptions;
	onChange: (value: string) => void;
}

interface PropertyButtonProps extends Omit<PropertyButtonsProps, "value"> {
	value: string;
}

const getInput = (type: InputType, checked: boolean, props: PropertyButtonProps): React.ReactNode => {
	const translationKey: TranslationKey = `properties.system.${props.name}.values.${props.value}`;
	switch (type) {
		case "radio":
			return (
				<DropdownMenuRadioItem key={props.value} value={props.value}>
					{hasTranslation(translationKey) ? t(translationKey) : props.value}
				</DropdownMenuRadioItem>
			);
		case "checkbox":
			return (
				<DropdownMenuCheckboxItem
					key={props.value}
					checked={props.options?.invertChecked ? !checked : checked}
					onSelect={(event) => {
						if (props.options?.closeOnSelect) event.preventDefault();
					}}
					onCheckedChange={() => props.onChange(props.value)}
				>
					{hasTranslation(translationKey) ? t(translationKey) : props.value}
				</DropdownMenuCheckboxItem>
			);
		default:
			return null;
	}
};

const PropertyButtons = (props: PropertyButtonsProps) => {
	const { values, name, type, onChange, options } = props;

	const buttons = values?.map((v) =>
		getInput(type, Array.isArray(props.value) ? props.value?.includes(v) : props.value, {
			name,
			type,
			values,
			value: v,
			onChange,
			options,
		}),
	);

	if (type === "radio") {
		return (
			<DropdownMenuRadioGroup
				value={props.value?.[0]}
				onValueChange={props.onChange}
				onSelect={(event) => {
					if (props.options?.closeOnSelect) event.preventDefault();
				}}
			>
				{buttons}
			</DropdownMenuRadioGroup>
		);
	}

	return buttons;
};

export default PropertyButtons;
