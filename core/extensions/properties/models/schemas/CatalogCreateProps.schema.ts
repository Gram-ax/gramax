import type Style from "@components/HomePage/Cards/model/Style";
import type { PropertyTypes } from "@ext/properties/models";

/**
 * @see catalog-create-props
 */
export interface CatalogCreateProps {
	name: string;
	id?: string;
	/**
	 * @see properties.types
	 */
	type: PropertyTypes;
	icon?: string;
	/**
	 * @see catalog.style
	 */
	style?: Style;
	values?: string[];
}

export default CatalogCreateProps;
