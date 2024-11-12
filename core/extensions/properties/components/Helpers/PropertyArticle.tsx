import Property from "@ext/properties/components/Property";
import PopupMenuLayout from "@components/Layouts/PopupMenuLayout";
import { getInputType, Property as PropertyType } from "@ext/properties/models";
import { PropertyTypes } from "@ext/properties/models";
import PropertyButton from "@ext/properties/components/PropertyButton";
import Input from "@components/Atoms/Input";
import PropertyItem from "@ext/properties/components/PropertyItem";
import t from "@ext/localization/locale/translate";
import { KeyboardEvent, MouseEvent } from "react";

interface PropertyArticleProps {
	isReadOnly: boolean;
	property: PropertyType;
	updateNumeric: (name: string, instance: any) => void;
	deleteProperty: (name: string) => void;
	handleClick: (e: MouseEvent | KeyboardEvent, id: string, value: string) => void;
	onKeyDown: (e: KeyboardEvent, id: string) => void;
}

const PropertyArticle = (props: PropertyArticleProps) => {
	const { isReadOnly, property, updateNumeric, deleteProperty, handleClick, onKeyDown } = props;
	return (
		<PopupMenuLayout
			offset={[0, 10]}
			appendTo={() => document.body}
			disabled={isReadOnly}
			key={property.name}
			hideOnClick={false}
			onClose={(instance) => property.type === PropertyTypes.numeric && updateNumeric(property.name, instance)}
			trigger={
				<Property
					key={property.name}
					type={property.type}
					icon={property.icon}
					value={property.value ? property.value : property.name}
					name={property.name}
					propertyStyle={property.style}
				/>
			}
		>
			<>
				{getInputType[property.type] && (
					<Input
						type={getInputType[property.type]}
						onKeyDown={(e) => onKeyDown(e, property.name)}
						placeholder={property.value?.[0]}
					/>
				)}
				{property?.values?.map((val) => (
					<PropertyButton
						key={val}
						canMany
						inputType="radio"
						name={val}
						checked={property.value?.includes(val)}
						onClick={(e) => handleClick(e, property.name, val)}
					/>
				))}
				{(property?.values?.length > 0 || getInputType[property.type]) && <div className="divider" />}
				<PropertyItem
					id={property.name}
					name={t("delete")}
					icon="trash"
					onClick={(_, id) => deleteProperty(id)}
				/>
			</>
		</PopupMenuLayout>
	);
};

export default PropertyArticle;
