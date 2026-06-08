import { CatalogViewTag } from "@ext/catalog/views/components/Helpers/CatalogViewTag";
import { useFilterValue } from "@ext/catalog/views/logic/hooks/useFilterValue";
import t from "@ext/localization/locale/translate";
import { PropertyTypes } from "@ext/properties/models";
import { TextOverflowTooltip } from "@ui-kit/Tooltip";
import type { ComponentType } from "react";

export type ViewFilterInputComponentProps<T extends PropertyTypes = PropertyTypes> = {
	type: T;
	value: string[];
	values: string[];
	onChange: (value: string[]) => void;
};

interface DefaultInputComponentProps {
	value: string[];
	values: string[];
	onChange: (value: string[]) => void;
}

interface InputableComponentProps {
	value: string[];
	values: string[];
	onChange: (value: string[]) => void;
}

const DefaultInputComponent = ({ value = [], values, onChange }: DefaultInputComponentProps) => {
	const { onSelectNone, onSelectValue } = useFilterValue({ values, value, onChange });

	return (
		<>
			<CatalogViewTag
				onLabelClick={(e) => onSelectNone(e)}
				state={value.includes("none") ? "inactive" : "active"}
			>
				<TextOverflowTooltip>{t("properties.empty")}</TextOverflowTooltip>
			</CatalogViewTag>
			{values?.map((val) => (
				<CatalogViewTag
					key={val}
					onClick={() => onSelectValue(val)}
					state={value.includes(val) ? "inactive" : "active"}
				>
					<TextOverflowTooltip>{val === "yes" ? t("properties.selected") : val}</TextOverflowTooltip>
				</CatalogViewTag>
			))}
		</>
	);
};

const InputableComponent = ({ value = [], values, onChange }: InputableComponentProps) => {
	return <DefaultInputComponent onChange={onChange} value={value} values={values ?? ["yes"]} />;
};

const getInputComponent = (type: PropertyTypes): ComponentType<ViewFilterInputComponentProps<PropertyTypes>> => {
	return {
		[PropertyTypes.enum]: DefaultInputComponent,
		[PropertyTypes.many]: DefaultInputComponent,
		[PropertyTypes.date]: InputableComponent,
		[PropertyTypes.text]: InputableComponent,
		[PropertyTypes.numeric]: InputableComponent,
		[PropertyTypes.flag]: InputableComponent,
		[PropertyTypes.blockMd]: InputableComponent,
	}[type];
};

export const ViewFilterInputComponent = <T extends PropertyTypes>(props: ViewFilterInputComponentProps<T>) => {
	const { type } = props;

	const InputComponent = getInputComponent(type);
	if (!InputComponent) return null;

	return <InputComponent {...props} />;
};
