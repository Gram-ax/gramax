import styled from "@emotion/styled";
import t from "@ext/localization/locale/translate";
import { ArticlePropertyWrapper } from "@ext/properties/components/ArticlePropertyWrapper";
import PropertyComponent from "@ext/properties/components/Property";
import { type Property, PropertyTypes } from "@ext/properties/models";
import {
	type FilterablePropertyItem,
	getSelectedValues,
} from "@ext/serach/components/propertyFilter/propertyFilterModel";
import { Fragment, useRef } from "react";

interface FilteredPropertyBlockProps {
	properties: FilterablePropertyItem[];
	togglePropertyValue: (id: string, value?: string) => void;
	selectEmptyPropertyValue: (id: string) => void;
	className?: string;
}

const FilteredPropertyBlockComponent = (props: FilteredPropertyBlockProps) => {
	const { properties, togglePropertyValue, selectEmptyPropertyValue, className } = props;

	return (
		<div className={className}>
			<ArticlePropertyWrapper>
				{properties.map((item) => {
					const { property } = item;
					const selectedValues = getSelectedValues(item);

					return (
						<Fragment key={property.id}>
							{item.selection.emptySelected && (
								<PropertyBadge
									label={t("properties.empty")}
									onClear={() => selectEmptyPropertyValue(property.id)}
									property={property}
								/>
							)}
							{selectedValues.map((propValue) => (
								<Fragment key={`${property.id}-${propValue}`}>
									<PropertyBadge
										label={getLabel(property, propValue)}
										onClear={() => togglePropertyValue(property.id, propValue)}
										property={property}
									/>
								</Fragment>
							))}
						</Fragment>
					);
				})}
			</ArticlePropertyWrapper>
		</div>
	);
};

// 6rem = 3 rows
export const FilteredPropertyBlock = styled(FilteredPropertyBlockComponent)`
	max-height: 6rem;
	overflow-y: auto;
	overflow-x: hidden;
`;

interface PropertyBadgeProps {
	property: Property;
	onClear: () => void;
	label: string;
}

const PropertyBadge = ({ property, onClear, label }: PropertyBadgeProps) => {
	const insideBadgeRef = useRef(false);

	return (
		<div
			onMouseDown={(e) => {
				if (e.button !== 1) return;
				insideBadgeRef.current = true;
				e.preventDefault();
			}}
			onMouseLeave={() => {
				insideBadgeRef.current = false;
			}}
			onMouseUp={(e) => {
				if (e.button === 1 && insideBadgeRef.current) {
					onClear();
					e.preventDefault();
				}

				insideBadgeRef.current = false;
			}}
		>
			<PropertyComponent
				icon={property.icon}
				name={property.name}
				onClear={onClear}
				propertyStyle={property.style}
				style={{
					cursor: "default",
				}}
				type={getDisplayType(property)}
				value={label}
			/>
		</div>
	);
};

const getLabel = (property: Property, value: string) => {
	return property.type === PropertyTypes.flag ? property.name : value;
};

const getDisplayType = (property: Property) => {
	return property.type === PropertyTypes.flag ? PropertyTypes.text : property.type;
};
