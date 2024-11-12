import Permission from "./Permission";

const readPermission = new Permission(["ReadCatalogContent"]);
const configureCatalogPermission = new Permission(["ConfigureCatalog"]);
const configureWorkspacePermission = new Permission(["ConfigureWorkspace"]);

export { configureCatalogPermission, configureWorkspacePermission, readPermission };
