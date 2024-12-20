import { ClientCatalogProps } from "@core/SitePresenter/SitePresenter";
import ViewButton from "@ext/markdown/elements/view/edit/components/Helpers/ViewButton";
import { Property, PropertyTypes, PropertyValue, SystemProperties } from "@ext/properties/models";
import { ReactNode, useCallback, useMemo } from "react";
import FilterMenu from "@ext/markdown/elements/view/edit/components/Helpers/FilterMenu";

interface AddFilterProps {
	icon: string;
	attributeName: string;
	catalogProps: ClientCatalogProps;
	properties: PropertyValue[] | string[];
	updateAttributes: (attributes: Record<string, any>) => void;
	tooltipText?: string;
	availableValues?: boolean;
	customPropertyMenu?: (
		property: Property,
		updateData: (name: string, value: string | string[]) => void,
	) => ReactNode;
	oneValue?: boolean;
	allowAddAll?: boolean;
	specialValues?: boolean;
	allowSystemProperties?: boolean;
	closeOnSelection?: boolean;
}

export interface PropertyFilter extends Property {
	selected?: boolean;
}

const AddFilter = (props: AddFilterProps) => {
	const {
		icon,
		attributeName,
		catalogProps,
		properties,
		updateAttributes,
		customPropertyMenu,
		availableValues = true,
		oneValue = false,
		tooltipText,
		allowSystemProperties = true,
		closeOnSelection = true,
		specialValues = false,
		allowAddAll = false,
	} = props;
	const noAssignedProperties: PropertyFilter[] = useMemo(() => {
		return catalogProps.properties
			.filter((prop) => allowSystemProperties || !SystemProperties[prop.name.toLowerCase()])
			.map((prop) => {
				const assignedProp = properties.findIndex(
					(assignedProp) =>
						(typeof assignedProp === "string" ? assignedProp : assignedProp.name) === prop.name,
				);

				if (assignedProp !== -1)
					return {
						...prop,
						selected: true,
						value:
							typeof properties[assignedProp] !== "string"
								? properties[assignedProp].value
								: [properties[assignedProp]],
					};

				return prop;
			});
	}, [catalogProps?.properties, properties]);

	const addFilter = useCallback(
		(name: string, val?: string | string[]) => {
			const property = catalogProps.properties.find((prop) => prop.name === name);
			if (!property) return;

			let newValue: string[] = [];

			if (Array.isArray(val)) newValue = val;
			else if (availableValues && !oneValue) {
				if (val === "all")
					newValue =
						property.type === PropertyTypes.flag ? ["yes", "none"] : [...(property.values || []), "none"];
				else if (typeof val === "string") newValue = [val];
			} else if (oneValue) newValue = [name];

			updateAttributes({
				[attributeName]: [
					...(!oneValue ? properties : []),
					availableValues ? { name: property.name, ...(newValue && { value: newValue }) } : property.name,
				],
			});
		},
		[catalogProps, properties, oneValue, availableValues],
	);

	const removeProperty = useCallback(
		(deleteProp: string | PropertyValue) => {
			return updateAttributes({
				[attributeName]: properties.filter((prop) => prop !== deleteProp),
			});
		},
		[properties],
	);

	const updateProperty = useCallback(
		(propIndex: number, newValues: string[]) => {
			return updateAttributes({
				[attributeName]: properties.map((def, index) =>
					index === propIndex ? { ...def, value: newValues } : def,
				),
			});
		},
		[properties],
	);

	const filterProps = useCallback(
		(prop: string | PropertyValue, values: string[], val: string | string[]): string[] => {
			let newValues = values;
			if (Array.isArray(val)) newValues = val;
			else if (newValues.includes(val)) {
				newValues = newValues.filter((v) => v !== val);
				if (newValues.length === 0) {
					removeProperty(prop);
					return;
				}
			} else newValues.push(val);
			return newValues;
		},
		[properties],
	);

	const updateFilter = useCallback(
		(name: string, val?: string | string[]) => {
			const originalProperty = catalogProps.properties.find((prop) => prop.name === name);
			if (!originalProperty) return;

			const propIndex = properties.findIndex((def) => {
				const defName = typeof def === "string" ? def : def.name;
				return defName === name;
			});
			const existingProperty = properties[propIndex];

			if (oneValue || !val) {
				if (!existingProperty) return addFilter(name, val);
				return removeProperty(existingProperty);
			}

			if (val === "all") {
				if (existingProperty) {
					const allValues =
						originalProperty.type === PropertyTypes.flag
							? ["yes", "none"]
							: [...(originalProperty?.values || []), "none"];
					if (typeof existingProperty !== "string" && existingProperty.value.length === allValues.length)
						return removeProperty(existingProperty);
					return updateProperty(propIndex, allValues);
				}
				return addFilter(name, "all");
			}

			if (existingProperty && typeof existingProperty !== "string") {
				const newValues = filterProps(existingProperty, existingProperty?.value.slice(), val);
				if (typeof newValues === "undefined") return;
				return updateProperty(propIndex, newValues);
			}

			return addFilter(name, val);
		},
		[catalogProps, updateAttributes, properties, attributeName, oneValue],
	);

	return (
		<div className="view-filter-row">
			<ViewButton icon={icon} tooltipText={tooltipText} closeOnSelection={closeOnSelection}>
				<FilterMenu
					allowAddAll={allowAddAll}
					noAssignedProperties={noAssignedProperties}
					updateFilter={updateFilter}
					customPropertyMenu={customPropertyMenu}
					closeOnSelection={closeOnSelection}
					specialValues={specialValues}
					availableValues={availableValues}
				/>
			</ViewButton>
		</div>
	);
};

export default AddFilter;
