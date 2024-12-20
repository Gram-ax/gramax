import CatalogPropsService from "@core-ui/ContextServices/CatalogProps";
import { Property, SystemProperties } from "@ext/properties/models";
import { createContext, ReactElement, useContext, useMemo } from "react";

type PropertyService = {
	properties: Map<string, Property>;
};

const PropertyContext = createContext<PropertyService>(undefined);
class PropertyServiceProvider {
	static Provider({ children }: { children: ReactElement | ReactElement[] }): ReactElement {
		const catalogProps = CatalogPropsService.value;
		const properties: Map<string, Property> = useMemo(
			() =>
				catalogProps?.properties
					? new Map(
							catalogProps.properties
								.filter((prop) => !SystemProperties[prop.name])
								.map((prop) => [prop.name, prop]),
					  )
					: new Map(),
			[catalogProps?.properties],
		);

		return <PropertyContext.Provider value={{ properties }}>{children}</PropertyContext.Provider>;
	}

	static get value(): PropertyService {
		const value = useContext(PropertyContext);
		return value;
	}
}

export default PropertyServiceProvider;
