import ArticlePropsService from "@core-ui/ContextServices/ArticleProps";
import CatalogPropsService from "@core-ui/ContextServices/CatalogProps";
import combineProperties from "@ext/properties/logic/combineProperties";
import { Property, SystemProperties } from "@ext/properties/models";
import { createContext, ReactElement, useContext, useMemo, useState, useEffect, Dispatch, SetStateAction } from "react";

type PropertyService = {
	properties: Map<string, Property>;
	articleProperties: Property[];
	setArticleProperties: Dispatch<SetStateAction<Property[]>>;
};

const PropertyContext = createContext<PropertyService>(undefined);
class PropertyServiceProvider {
	static Provider({ children }: { children: ReactElement | ReactElement[] }): ReactElement {
		const [articleProperties, setArticleProperties] = useState<Property[]>([]);
		const catalogProps = CatalogPropsService.value;
		const articleProps = ArticlePropsService.value;

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

		useEffect(() => {
			setArticleProperties(combineProperties(articleProps.properties, Array.from(properties.values())));
		}, []);

		return (
			<PropertyContext.Provider value={{ properties, articleProperties, setArticleProperties }}>
				{children}
			</PropertyContext.Provider>
		);
	}

	static get value(): PropertyService {
		const value = useContext(PropertyContext);
		return value;
	}
}

export default PropertyServiceProvider;
