import Permission from "./Permission";

export const readPermission = new Permission(["ReadCatalogContent"]);
export const editCatalogContentPermission = new Permission(["EditCatalogContent"]);
export const editCatalogPermission = new Permission(["EditCatalog"]);
export const configureCatalogPermission = new Permission(["ConfigureCatalog"]);
export const configureWorkspacePermission = new Permission(["ConfigureWorkspace"]);
