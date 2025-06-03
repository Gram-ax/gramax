import { addAllCatalogsToIndex } from "@ext/git/migration/useInitCatalogToIndex";

const onExperimentalFeaturesClick = () => {
	if (window.debug?.devMode.check()) addAllCatalogsToIndex();
};

export default onExperimentalFeaturesClick;
