export const getResourceId = (pathName: string, sourceName: string, catalogName: string) => {
	const prefix = `${sourceName}/`;
	const withoutSource = pathName.startsWith(prefix) ? pathName.slice(prefix.length) : pathName;
	const segments = withoutSource.split("/").filter(Boolean);
	const catalogIndex = segments.indexOf(catalogName);
	if (catalogIndex === -1) return withoutSource;
	return segments.slice(0, catalogIndex + 1).join("/");
};
