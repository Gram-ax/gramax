import { CatalogLink } from "@ext/navigation/NavigationLinks";

const convertCatalogLink = (catalogName: string, catalogLink: CatalogLink): CatalogLink => {
	// todo: think about lastVisited
	return {
		...catalogLink,
		lastVisited: undefined,
		pathname: `/${catalogName}`,
	};
};

export default convertCatalogLink;
