import type { ReadonlyCatalog } from "@core/FileStructue/Catalog/ReadonlyCatalog";
import type EnterpriseUser from "@ext/enterprise/EnterpriseUser";
import type User from "@ext/security/logic/User/User";

export const getMainBranch = (user: User, catalog: ReadonlyCatalog) => {
	if (user.type !== "enterprise") return "";
	return (user as EnterpriseUser).getEnterpriseInfo().catalogsProps?.[catalog?.name]?.mainBranch ?? "";
};

export const isMainBranchProtected = (user: User, catalog: ReadonlyCatalog) => {
	if (user.type !== "enterprise") return false;
	const mainBranch = getMainBranch(user, catalog);
	return (
		(user as EnterpriseUser).getEnterpriseInfo().catalogsProps?.[catalog?.name]?.mainBranchProtected ??
		Boolean(mainBranch)
	);
};

export const isCurrentBranchProtected = async (user: User, catalog: ReadonlyCatalog) => {
	const mainBranch = getMainBranch(user, catalog);
	if (!mainBranch || !isMainBranchProtected(user, catalog)) return false;

	try {
		const branch = await catalog?.repo?.gvc?.getCurrentBranch?.();
		return branch?.toString() === mainBranch;
	} catch {
		return false;
	}
};
