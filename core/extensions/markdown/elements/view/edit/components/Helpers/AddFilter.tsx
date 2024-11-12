import { ClientCatalogProps } from "@core/SitePresenter/SitePresenter";
import ViewButton from "@ext/markdown/elements/view/edit/components/Helpers/ViewButton";
import PropertyItem from "@ext/properties/components/PropertyItem";
import { Property, PropertyTypes, PropertyValue, SystemProperties } from "@ext/properties/models";
import { ReactNode, useCallback, useMemo } from "react";
import t from "@ext/localization/locale/translate";
import PropertyButton from "@ext/properties/components/PropertyButton";

interface AddFilterProps {
	name: ReactNode;
	attributeName: string;
	catalogProps: ClientCatalogProps;
	properties: PropertyValue[] | string[];
	updateAttributes: (attributes: Record<string, any>) => void;
	tooltipText?: string;
	availableValues?: boolean;
	oneValue?: boolean;
	allowSystemProperties?: boolean;
	closeOnSelection?: boolean;
}

interface PropertyFilter extends Property {
	selected?: boolean;
}

const AddFilter = (props: AddFilterProps) => {
	const {
		name,
		attributeName,
		catalogProps,
		properties,
		updateAttributes,
		availableValues = true,
		oneValue = false,
		tooltipText,
		allowSystemProperties = true,
		closeOnSelection = true,
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
		(name: string, val?: string) => {
			const property = catalogProps.properties.find((prop) => prop.name === name);
			if (!property) return;

			let newValue: string[] = [];

			if (availableValues && !oneValue) {
				if (val === "all")
					newValue =
						property.type === PropertyTypes.flag ? ["yes", "none"] : [...(property.values || []), "none"];
				else if (val) newValue = [val];
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
		(prop: string | PropertyValue, values: string[], val: string): string[] => {
			let newValues = values;
			if (newValues.includes(val)) {
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
		(name: string, val?: string) => {
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
			<ViewButton name={name} tooltipText={tooltipText} closeOnSelection={closeOnSelection}>
				{noAssignedProperties.map((property) => {
					const isNotENum = property.type !== PropertyTypes.enum;
					return (
						<PropertyItem
							canMany
							hasAllProperty
							hasNoneProperty={!isNotENum}
							id={property.name}
							icon={property.selected && "check"}
							key={property.name}
							name={property.name}
							value={property.value}
							values={availableValues ? property.values ?? ["yes"] : undefined}
							onClick={(_, name: string, value) => updateFilter(name, value)}
							closeOnSelection={closeOnSelection}
						>
							{isNotENum && availableValues && (
								<>
									<PropertyButton
										name={t("properties.selected")}
										canMany
										checked={!property?.value?.includes("yes")}
										onClick={() => updateFilter?.(property.name, "yes")}
									/>
									<PropertyButton
										name={t("properties.not-selected")}
										canMany
										checked={!property?.value?.includes("none")}
										onClick={() => updateFilter?.(property.name, "none")}
									/>
								</>
							)}
						</PropertyItem>
					);
				})}
			</ViewButton>
		</div>
	);
};

export default AddFilter;
