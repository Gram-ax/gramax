import type BaseCatalog from "@core/FileStructue/Catalog/BaseCatalog";
import SecurityRules from "@ext/security/logic/SecurityRules";
import type User from "@ext/security/logic/User/User";

export const getAccessibleCatalogs = <T extends BaseCatalog>(user: User, catalogs: Iterable<T>): T[] => {
	const result = [];
	for (const entry of catalogs) {
		if (SecurityRules.canReadCatalog(user, entry.perms, entry.name)) {
			result.push(entry);
		}
	}
	return result;
};
