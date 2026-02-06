import Icon from "@components/Atoms/Icon";
import useWatch from "@core-ui/hooks/useWatch";
import t from "@ext/localization/locale/translate";
import {
	CustomInputRenderer,
	getInputComponent,
	InputValue,
} from "@ext/properties/components/Helpers/CustomInputRenderer";
import PropertyButtons from "@ext/properties/components/Helpers/PropertyButtons";
import getFormatValue from "@ext/properties/logic/getFormatValue";
import { isManyProperty, Property as PropertyType } from "@ext/properties/models";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@ui-kit/Dropdown";
import { memo, useMemo, useState } from "react";

interface PropertyArticleProps {
	trigger: JSX.Element;
	property: PropertyType;
	disabled?: boolean;
	canDelete?: boolean;
	hideClear?: boolean;
	renderInput?: ({ value, onChange }: { value: string; onChange: (value: InputValue) => void }) => JSX.Element;
	onSubmit: (propertyName: string, value: string, isDelete?: boolean) => void;
}

const PropertyArticle = memo((props: PropertyArticleProps) => {
	const { disabled, trigger, property, onSubmit, canDelete = true, renderInput, hideClear } = props;
	const [value, setValue] = useState<string[] | string>(property.value);

	const InputComponent = renderInput || getInputComponent(property.type);

	useWatch(() => {
		if (InputComponent) setValue(property.value?.[0] ?? "");
	}, [property.value]);

	const onChange = (incomingValue: InputValue) => {
		if (!InputComponent) return onSubmit(property.name, getFormatValue(incomingValue), false);
		setValue((prevValue) => {
			const isArray = typeof incomingValue !== "string" && Array.isArray(incomingValue);
			const formattedValue = isArray
				? [...prevValue, getFormatValue(incomingValue)]
				: getFormatValue(incomingValue);
			return formattedValue;
		});
	};

	const onOpenChange = (open: boolean) => {
		if (open || renderInput || !InputComponent) return;
		onSubmit(property.name, getFormatValue(value), false);
	};

	const deleteProperty = () => onSubmit(property.name, undefined, true);

	const buttons = useMemo(() => {
		return (
			<PropertyButtons
				name={property.name}
				onChange={onChange}
				type={isManyProperty[property.type] ? "checkbox" : "radio"}
				value={property.value}
				values={property.values}
			/>
		);
	}, [property.values, property.value, property.name]);

	const getInputRenderer = () => {
		if (renderInput) return renderInput({ value: typeof value === "string" ? value : value?.[0], onChange });
		return <CustomInputRenderer onChange={onChange} type={property.type} value={value} />;
	};

	return (
		<DropdownMenu onOpenChange={onOpenChange}>
			<DropdownMenuTrigger asChild disabled={disabled}>
				{trigger}
			</DropdownMenuTrigger>
			<DropdownMenuContent align="start">
				<DropdownMenuLabel>{property.name}</DropdownMenuLabel>
				<DropdownMenuSeparator />
				{buttons}
				{InputComponent && getInputRenderer()}
				{!hideClear && (property?.values?.length > 0 || InputComponent) && <DropdownMenuSeparator />}
				{canDelete && !hideClear && (
					<DropdownMenuItem onSelect={deleteProperty}>
						<Icon code="eraser" />
						{t("clear")}
					</DropdownMenuItem>
				)}
			</DropdownMenuContent>
		</DropdownMenu>
	);
});

export default PropertyArticle;
