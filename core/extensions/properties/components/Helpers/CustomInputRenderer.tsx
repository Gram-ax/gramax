import Input from "@components/Atoms/Input";
import t from "@ext/localization/locale/translate";
import { PropertyTypes } from "@ext/properties/models";
import { Calendar } from "@ui-kit/Calendar";
import { ComponentType, useEffect, useState } from "react";

type BaseValue = string | number | Date;
export type InputValue = BaseValue | Array<BaseValue>;

interface InputProps<T = InputValue> {
	value: T;
	onChange: (value: T) => void;
}

const CalendarInput = (props: InputProps<Date>) => {
	const [selectedValue, setSelectedValue] = useState<Date>(props.value);
	const onSelect = (value: Date) => {
		setSelectedValue(value);
		props.onChange(value);
	};

	useEffect(() => {
		const isLocalizedDate = props.value instanceof Date;
		const selectedDate = isLocalizedDate ? props.value : new Date(props.value ? props.value : new Date());
		setSelectedValue(selectedDate);
	}, [props.value]);

	return (
		<Calendar
			selected={selectedValue}
			onSelect={onSelect}
			mode="single"
			defaultMonth={selectedValue}
			className="border-0 shadow-none bg-transparent"
			classNames={{
				dropdown_root:
					"has-focus:border-ring has-focus:ring-ring/50 has-focus:ring-[3px] shadow-xs relative rounded-md border border-input text-foreground",
			}}
		/>
	);
};

const NumericInput = (props: InputProps<number>) => {
	return (
		<Input
			type="number"
			placeholder={t("enter-number")}
			value={props.value}
			onChange={(e) => props.onChange(Number(e.target.value))}
		/>
	);
};

const BaseInput = (props: InputProps<string>) => {
	return <Input placeholder={t("enter-text")} value={props.value} onChange={(e) => props.onChange(e.target.value)} />;
};

export const getInputComponent = (type: PropertyTypes): ComponentType<InputProps> => {
	return {
		[PropertyTypes.date]: CalendarInput,
		[PropertyTypes.numeric]: NumericInput,
		[PropertyTypes.text]: BaseInput,
	}[type];
};

interface CustomInputRendererProps extends Omit<InputProps, "onChange"> {
	type: PropertyTypes;
	onChange: (value: InputValue) => void;
}

export const CustomInputRenderer = (props: CustomInputRendererProps) => {
	const { type, value, onChange } = props;
	const InputComponent = getInputComponent(type);

	if (!InputComponent) return null;
	return <InputComponent value={value} onChange={onChange} />;
};
