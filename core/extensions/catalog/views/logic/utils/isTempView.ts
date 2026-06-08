import type { CatalogView } from "@ext/catalog/views/models/CatalogViews";

const isTempView = (view: CatalogView): boolean => {
	return view?.options?.temp === true;
};

export default isTempView;
