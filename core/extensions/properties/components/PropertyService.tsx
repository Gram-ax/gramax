import ArticlePropsService from "@core-ui/ContextServices/ArticleProps";
import useWatch from "@core-ui/hooks/useWatch";
import { useCatalogPropsStore } from "@core-ui/stores/CatalogPropsStore/CatalogPropsStore.provider";
import combineProperties from "@ext/properties/logic/combineProperties";
import { Property, SystemProperties } from "@ext/properties/models";
import { createContext, Dispatch, ReactElement, SetStateAction, useContext, useEffect, useState } from "react";

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

		const catalogProperties = useCatalogPropsStore((state) => state.data?.properties, "shallow");
		const articleProps = ArticlePropsService.value;

		useEffect(() => {
			const articleProperties = combineProperties(articleProps.properties, properties);
			setArticleProperties(articleProperties);
		}, [articleProps.properties, properties]);

		const updateProperties = () => {
			const map = catalogProperties
				? new Map(
						catalogProperties
							.filter((prop) => !SystemProperties[prop.name])
							.map((prop) => [prop.name, prop]),
					)
				: new Map();

			setProperties(map);
		};

		useWatch(() => {
			updateProperties();
		}, [catalogProperties]);

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
