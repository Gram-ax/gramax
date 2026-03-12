import Permission from "./Permission";

export const readPermission = new Permission(["ReadCatalogContent"]);
export const editCatalogContentPermission = new Permission(["EditCatalogContent"]);
export const editCatalogPermission = new Permission(["EditCatalog"]);
export const readWorkspacePermission = new Permission(["ReadWorkspace"]);
export const configureCatalogPermission = new Permission(["ConfigureCatalog"]);
export const configureWorkspacePermission = new Permission(["ConfigureWorkspace"]);

export const ALL_PERMISSIONS = [
	"ReadCatalogContent",
	"CloneCatalogContent",
	"EditCatalogContent",
	"EditCatalog",
	"ReadWorkspace",
	"ConfigureCatalog",
	"ConfigureWorkspace",
] as const;

export type PermissionType = (typeof ALL_PERMISSIONS)[number];
