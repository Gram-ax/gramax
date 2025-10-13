import ArticlePropsService from "@core-ui/ContextServices/ArticleProps";
import CatalogPropsService from "@core-ui/ContextServices/CatalogProps";
import useWatch from "@core-ui/hooks/useWatch";
import combineProperties from "@ext/properties/logic/combineProperties";
import { Property, SystemProperties } from "@ext/properties/models";
import { createContext, ReactElement, useContext, useState, useEffect, Dispatch, SetStateAction } from "react";

export type PropertyService = {
	properties: Map<string, Property>;
	articleProperties: Property[];
	setArticleProperties: Dispatch<SetStateAction<Property[]>>;
};

const PropertyContext = createContext<PropertyService>({
	properties: new Map(),
	articleProperties: [],
	setArticleProperties: () => {},
});

class PropertyServiceProvider {
	static Provider({ children }: { children: ReactElement | ReactElement[] }): ReactElement {
		const [articleProperties, setArticleProperties] = useState<Property[]>([]);
		const [properties, setProperties] = useState<Map<string, Property>>(new Map());

		const catalogProps = CatalogPropsService.value;
		const articleProps = ArticlePropsService.value;

		useEffect(() => {
			const articleProperties = combineProperties(articleProps.properties, properties);
			setArticleProperties(articleProperties);
		}, [articleProps.properties, properties]);

		const updateProperties = () => {
			const map = catalogProps?.properties
				? new Map(
						catalogProps.properties
							.filter((prop) => !SystemProperties[prop.name])
							.map((prop) => [prop.name, prop]),
				  )
				: new Map();

			setProperties(map);
		};

		useWatch(() => {
			updateProperties();
		}, [catalogProps.properties]);

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
