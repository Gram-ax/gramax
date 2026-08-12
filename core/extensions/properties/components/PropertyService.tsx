/** biome-ignore-all lint/complexity/noStaticOnlyClass: expected */
import useWatch from "@core-ui/hooks/useWatch";
import { useArticlePropsStore } from "@core-ui/stores/ArticlePropsStore/ArticlePropsStore.provider";
import { useCatalogPropsStore } from "@core-ui/stores/CatalogPropsStore/CatalogPropsStore.provider";
import combineProperties from "@ext/properties/logic/combineProperties";
import { type Property, SystemProperties } from "@ext/properties/models";
import {
	createContext,
	type Dispatch,
	type ReactElement,
	type SetStateAction,
	useCallback,
	useContext,
	useEffect,
	useState,
} from "react";

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
		const articleProps = useArticlePropsStore((state) => state?.data?.properties);

		useEffect(() => {
			const articleProperties = combineProperties(articleProps, properties);
			setArticleProperties(articleProperties);
		}, [articleProps, properties]);

		const updateProperties = useCallback(() => {
			const map = catalogProperties
				? new Map(catalogProperties.filter((prop) => !SystemProperties[prop.id]).map((prop) => [prop.id, prop]))
				: new Map();

			setProperties(map);
		}, [catalogProperties]);

		useWatch(() => {
			updateProperties();
		}, [updateProperties]);

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
