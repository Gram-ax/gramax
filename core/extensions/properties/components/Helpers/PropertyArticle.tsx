import { isManyProperty, Property as PropertyType } from "@ext/properties/models";
import t from "@ext/localization/locale/translate";
import { memo, useMemo, useState } from "react";
import useWatch from "@core-ui/hooks/useWatch";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@ui-kit/Dropdown";
import Icon from "@components/Atoms/Icon";
import PropertyButtons from "@ext/properties/components/Helpers/PropertyButtons";
import {
	CustomInputRenderer,
	getInputComponent,
	InputValue,
} from "@ext/properties/components/Helpers/CustomInputRenderer";
import getFormatValue from "@ext/properties/logic/getFormatValue";

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
				type={isManyProperty[property.type] ? "checkbox" : "radio"}
				values={property.values}
				value={property.value}
				onChange={onChange}
			/>
		);
	}, [property.values, property.value, property.name]);

	const getInputRenderer = () => {
		if (renderInput) return renderInput({ value: typeof value === "string" ? value : value?.[0], onChange });
		return <CustomInputRenderer type={property.type} value={value} onChange={onChange} />;
	};

	return (
		<DropdownMenu onOpenChange={onOpenChange}>
			<DropdownMenuTrigger disabled={disabled} asChild>
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
