import t from "@ext/localization/locale/translate";
import { PropertyTypes } from "@ext/properties/models";
import { Calendar } from "@ui-kit/Calendar";
import {
	DropdownMenu,
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
	DropdownMenuTriggerButton,
} from "@ui-kit/Dropdown";
import { Icon } from "@ui-kit/Icon";
import { Input } from "@ui-kit/Input";
import { Popover, PopoverContent, PopoverTriggerButton } from "@ui-kit/Popover";
import { type ComponentType, useEffect, useState } from "react";

export type ViewVariableValueMap = {
	[PropertyTypes.numeric]: number;
	[PropertyTypes.enum]: string[];
	[PropertyTypes.date]: string;
	[PropertyTypes.many]: string[];
	[PropertyTypes.text]: string;
	[PropertyTypes.flag]: null;
	[PropertyTypes.blockMd]: null;
};

export type ViewVariableValuesMap = {
	[PropertyTypes.enum]: string[];
	[PropertyTypes.many]: string[];
	[PropertyTypes.flag]: null;
	[PropertyTypes.date]: null;
	[PropertyTypes.numeric]: null;
	[PropertyTypes.text]: null;
	[PropertyTypes.blockMd]: null;
};

export type ViewVariableInputComponentProps<T extends PropertyTypes = PropertyTypes> = {
	type: T;
	value: ViewVariableValueMap[T];
	values: ViewVariableValuesMap[T];
	onChange: (value: string[]) => void;
};

interface NumericInputProps {
	value: number;
	onChange: (value: string[]) => void;
}

const NumericInput = ({ value, onChange }: NumericInputProps) => {
	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		onChange([e.target.value]);
	};

	return <Input onChange={handleChange} placeholder={t("enter-number")} type="number" value={value} />;
};

interface ManyInputProps {
	value: string[];
	values: string[];
	onChange: (value: string[]) => void;
}

const ManyInput = ({ value = [], values, onChange }: ManyInputProps) => {
	return (
		<DropdownMenu>
			<DropdownMenuTriggerButton
				className="w-full justify-start pr-2.5 pl-3 py-1.5 font-normal"
				containerClassName="w-full justify-start"
			>
				{value.join(", ") || t("enter-value")}
				<Icon className="ml-auto text-muted" icon="chevron-down" />
			</DropdownMenuTriggerButton>
			<DropdownMenuContent style={{ width: "var(--radix-popper-anchor-width)" }}>
				{values.map((v) => (
					<DropdownMenuCheckboxItem
						checked={value.includes(v)}
						key={v}
						onSelect={() =>
							onChange([...value].includes(v) ? value.filter((val) => val !== v) : [...value, v])
						}
					>
						{v}
					</DropdownMenuCheckboxItem>
				))}
			</DropdownMenuContent>
		</DropdownMenu>
	);
};

interface DateInputProps {
	value: string;
	onChange: (value: string[]) => void;
}

const DateInput = ({ value = new Date().toISOString(), onChange }: DateInputProps) => {
	const [selectedValue, setSelectedValue] = useState<Date>(new Date(value));
	const onSelect = (value: Date) => {
		setSelectedValue(value);
		onChange([value.toISOString()]);
	};

	useEffect(() => {
		setSelectedValue(value ? new Date(value) : new Date());
	}, [value]);

	return (
		<Popover>
			<PopoverTriggerButton
				className="w-full justify-start pr-2.5 pl-3 py-1.5 font-normal"
				containerClassName="w-full justify-start"
				variant="outline"
			>
				<Icon icon="calendar" />
				{!value ? t("enter-value") : selectedValue.toLocaleDateString()}
				<Icon className="ml-auto text-muted" icon="chevron-down" />
			</PopoverTriggerButton>
			<PopoverContent className="p-0 w-auto">
				<Calendar
					className="border-0 shadow-none bg-transparent"
					classNames={{
						dropdown_root:
							"has-focus:border-ring has-focus:ring-ring/50 has-focus:ring-[3px] shadow-xs relative rounded-md border border-input text-foreground",
					}}
					defaultMonth={selectedValue}
					mode="single"
					onSelect={onSelect}
					selected={selectedValue}
				/>
			</PopoverContent>
		</Popover>
	);
};

interface EnumInputProps {
	value: string;
	values: string[];
	onChange: (value: string[]) => void;
}

const EnumInput = ({ value, values, onChange }: EnumInputProps) => {
	return (
		<DropdownMenu>
			<DropdownMenuTriggerButton
				className="w-full justify-start pr-2.5 pl-3 py-1.5 font-normal"
				containerClassName="w-full justify-start"
			>
				{value || t("enter-value")}
				<Icon className="ml-auto text-muted" icon="chevron-down" />
			</DropdownMenuTriggerButton>
			<DropdownMenuContent style={{ width: "var(--radix-popper-anchor-width)" }}>
				<DropdownMenuRadioGroup onValueChange={(value) => onChange([value])} value={value}>
					{values.map((v) => (
						<DropdownMenuRadioItem key={v} value={v}>
							{v}
						</DropdownMenuRadioItem>
					))}
				</DropdownMenuRadioGroup>
			</DropdownMenuContent>
		</DropdownMenu>
	);
};

interface TextInputProps {
	value: string;
	onChange: (value: string[]) => void;
}

const TextInput = ({ value, onChange }: TextInputProps) => {
	return <Input onChange={(e) => onChange([e.target.value])} placeholder={t("enter-value")} value={value} />;
};

const FlagInput = () => {
	return <div className="w-full" />;
};

const getInputComponent = (type: PropertyTypes): ComponentType<ViewVariableInputComponentProps<PropertyTypes>> => {
	return {
		[PropertyTypes.numeric]: NumericInput,
		[PropertyTypes.enum]: EnumInput,
		[PropertyTypes.date]: DateInput,
		[PropertyTypes.many]: ManyInput,
		[PropertyTypes.text]: TextInput,
		[PropertyTypes.flag]: FlagInput,
	}[type];
};

const resolveInputValue = (type: PropertyTypes, value: string[]) => {
	switch (type) {
		case PropertyTypes.numeric:
			return value[0] ? Number(value[0]) : null;
		case PropertyTypes.enum:
			return value[0] ? value[0] : null;
		case PropertyTypes.date:
			return value[0] ? new Date(value[0]) : null;
		case PropertyTypes.many:
			return value;
		case PropertyTypes.text:
			return value[0] ? value[0] : null;
		case PropertyTypes.blockMd:
			return;
	}
};

export const ViewVariableInputComponent = <T extends PropertyTypes>(props: ViewVariableInputComponentProps<T>) => {
	const { type } = props;

	const InputComponent = getInputComponent(type);
	if (!InputComponent) return null;
	const resolvedValue = resolveInputValue(type, props.value as string[]);
	return <InputComponent {...props} value={resolvedValue as ViewVariableValueMap[T]} />;
};
