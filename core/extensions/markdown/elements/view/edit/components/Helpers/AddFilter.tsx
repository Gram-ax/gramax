import { ClientCatalogProps } from "@core/SitePresenter/SitePresenter";
import { useCatalogPropsStore } from "@core-ui/stores/CatalogPropsStore/CatalogPropsStore.provider";
import FilterMenu from "@ext/markdown/elements/view/edit/components/Helpers/FilterMenu";
import ViewButton from "@ext/markdown/elements/view/edit/components/Helpers/ViewButton";
import { Property, PropertyTypes, PropertyValue, SystemProperties } from "@ext/properties/models";
import { ReactNode, useCallback, useMemo } from "react";

export type Mode = "single" | "multiple";

interface AddFilterProps {
	icon: string;
	ignoreEmpty?: boolean;
	attributeName: string;
	properties: PropertyValue[] | string[];
	tooltipText?: string;
	availableValues?: boolean;
	mode?: Mode;
	allowSystemProperties?: boolean;
	closeOnSelection?: boolean;
	updateAttributes: (attributes: Record<string, any>) => void;
	filter?: (property: Property) => boolean;
	customPropertyMenu?: (
		property: Property,
		updateData: (name: string, value: string | string[]) => void,
	) => ReactNode;
}

export interface PropertyFilter extends Property {
	selected?: boolean;
}

const AddFilter = (props: AddFilterProps) => {
	const {
		icon,
		ignoreEmpty,
		attributeName,
		properties,
		updateAttributes,
		customPropertyMenu,
		availableValues = true,
		mode = "multiple",
		tooltipText,
		allowSystemProperties = true,
		closeOnSelection = true,
		filter,
	} = props;
	const catalogProperties = useCatalogPropsStore((state) => state.data.properties, "shallow");
	const oneValue = mode === "single";
	const noAssignedProperties: PropertyFilter[] = useMemo(() => {
		return catalogProperties
			.filter((prop) => filter?.(prop) ?? true)
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
	}, [catalogProperties, properties, filter, allowSystemProperties]);

	const addFilter = useCallback(
		(name: string, val?: string | string[]) => {
			const property = catalogProperties.find((prop) => prop.name === name);
			if (!property) return;

			let newValue: string[] = [];

			if (Array.isArray(val)) newValue = val;
			else if (availableValues && !oneValue) {
				if (val?.includes("all")) {
					const includesNone = !val.includes("none");
					newValue =
						property.type === PropertyTypes.flag
							? ["yes", ...(includesNone ? ["none"] : [])]
							: [...(property.values || []), ...(includesNone ? ["none"] : [])];
				} else if (typeof val === "string") newValue = [val];
			} else if (oneValue) newValue = [name];

			updateAttributes({
				[attributeName]: [
					...(!oneValue ? properties : []),
					availableValues ? { name: property.name, ...(newValue && { value: newValue }) } : property.name,
				],
			});
		},
		[catalogProperties, properties, oneValue, availableValues],
	);

	const removeProperty = useCallback(
		(deleteProp: string | PropertyValue) => {
			return updateAttributes({
				[attributeName]: properties.filter((prop) => prop !== deleteProp),
			});
		},
		[properties, updateAttributes, attributeName],
	);

	const updateProperty = useCallback(
		(propIndex: number, newValues: string[]) => {
			return updateAttributes({
				[attributeName]: properties.map((def, index) =>
					index === propIndex ? { ...def, value: newValues } : def,
				),
			});
		},
		[properties, updateAttributes, attributeName],
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
		[properties, removeProperty],
	);

	const updateFilter = useCallback(
		(name: string, val?: string | string[]) => {
			const originalProperty = catalogProperties.find((prop) => prop.name === name);
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

			if (val.includes("all")) {
				const includesNone = !val.includes("none");
				if (existingProperty) {
					const allValues =
						originalProperty.type === PropertyTypes.flag
							? ["yes", ...(includesNone ? ["none"] : [])]
							: [...(originalProperty?.values || []), ...(includesNone ? ["none"] : [])];
					if (typeof existingProperty !== "string" && existingProperty.value.length === allValues.length)
						return removeProperty(existingProperty);
					return updateProperty(propIndex, allValues);
				}
				return addFilter(name, includesNone ? "all" : "all-none");
			}

			if (existingProperty && typeof existingProperty !== "string") {
				const newValues = filterProps(existingProperty, existingProperty?.value.slice(), val);
				if (typeof newValues === "undefined") return;
				return updateProperty(propIndex, newValues);
			}

			return addFilter(name, val);
		},
		[catalogProperties, updateAttributes, properties, attributeName, oneValue],
	);

	return (
		<div className="view-filter-row">
			<ViewButton empty={!noAssignedProperties.length} icon={icon} tooltipText={tooltipText}>
				<FilterMenu
					availableValues={availableValues}
					closeOnSelection={closeOnSelection}
					customPropertyMenu={customPropertyMenu}
					ignoreEmpty={ignoreEmpty}
					mode={mode}
					noAssignedProperties={noAssignedProperties}
					updateFilter={updateFilter}
				/>
			</ViewButton>
		</div>
	);
};

export default AddFilter;
