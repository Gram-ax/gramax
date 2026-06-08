import Properties, { type PropertiesProps } from "@ext/properties/components/Helpers/Properties";
import PropertyServiceProvider from "@ext/properties/components/PropertyService";
import combineProperties from "@ext/properties/logic/combineProperties";
import type { PropertyValue } from "@ext/properties/models";
import { useMemo } from "react";

interface NodePropertyProps extends Omit<PropertiesProps, "catalogProperties" | "properties" | "hideList"> {
	properties: PropertyValue[];
}

export const NodeProperty = ({ properties, ...otherProps }: NodePropertyProps) => {
	const { properties: catalogProperties } = PropertyServiceProvider.value;

	const combinedProperties = useMemo(() => {
		return combineProperties(properties, catalogProperties);
	}, [properties, catalogProperties]);

	return (
		<Properties {...otherProps} catalogProperties={catalogProperties} hideList properties={combinedProperties} />
	);
};
