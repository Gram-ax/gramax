import type { ReadonlyCatalog } from "@core/FileStructue/Catalog/ReadonlyCatalog";
import type EnterpriseUser from "@ext/enterprise/EnterpriseUser";
import type User from "@ext/security/logic/User/User";

export const getMainBranch = (user: User, catalog: ReadonlyCatalog) => {
	if (user.type !== "enterprise") return "";
	return (user as EnterpriseUser).getEnterpriseInfo().catalogsProps?.[catalog?.name]?.mainBranch ?? "";
};

export const isCurrentBranchMain = async (user: User, catalog: ReadonlyCatalog) => {
	const mainBranch = getMainBranch(user, catalog);
	if (!mainBranch) return false;

	try {
		const branch = await catalog?.repo?.gvc?.getCurrentBranch?.();
		return branch?.toString() === mainBranch;
	} catch {
		return false;
	}
};
