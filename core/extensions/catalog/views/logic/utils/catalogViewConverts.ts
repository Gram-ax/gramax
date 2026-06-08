import RouterPathProvider from "@core/RouterPath/RouterPathProvider";
import type { CatalogView } from "@ext/catalog/views/models/CatalogViews";
import { addScopeToPath } from "@ext/versioning/addScopeToPath";

export const convertCatalogViewIdToScope = (view: CatalogView) => {
	return `view-${view.id}`;
};

export const convertScopeToCatalogViewId = (scope: string) => {
	return scope.split("view-").at(1);
};

export const getCatalogViewIDFromPath = (path: string) => {
	const match = path.match(/view-([^/]+)/);
	return match?.[1];
};

export const removeCatalogViewScopeFromPath = (
	path: string,
	options: { catalogName?: string; isEditorPath: boolean },
): string => {
	if (!options.isEditorPath) return addScopeToPath(path);

	const data = RouterPathProvider.parsePath(path);
	const newPath = RouterPathProvider.getPathname({
		...data,
		catalogName: addScopeToPath(data.catalogName ?? options.catalogName ?? ""),
	});
	return newPath.value;
};
