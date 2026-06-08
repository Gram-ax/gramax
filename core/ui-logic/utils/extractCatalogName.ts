export const extractCatalogName = (catalogName: string): string => {
	return catalogName.split(":")?.[0]?.split("~")?.[0];
};
