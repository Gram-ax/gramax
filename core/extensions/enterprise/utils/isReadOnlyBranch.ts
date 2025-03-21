import { getExecutingEnvironment } from "@app/resolveModule/env";
import { Catalog } from "@core/FileStructue/Catalog/Catalog";
import EnterpriseUser from "@ext/enterprise/EnterpriseUser";
import { editCatalogPermission } from "@ext/security/logic/Permission/Permissions";
import User from "@ext/security/logic/User/User";

const isReadOnlyBranch = async (user: User, catalog: Catalog) => {
	if (getExecutingEnvironment() === "next") return true;
	if (user.type !== "enterprise") return false;
	
	const enterpriseInfo = (user as EnterpriseUser).getEnterpriseInfo();
	const props = enterpriseInfo.catalogsProps;
	const allowedBranches = props?.[catalog.name]?.branches ?? [];
	const mainBranch = props?.[catalog.name]?.mainBranch ?? "";

	try {
		const branch = await catalog?.repo?.gvc?.getCurrentBranch?.();
		if (!branch) return false;
		const branchStr = branch.toString();
		if (branchStr === mainBranch) return true;
		if (enterpriseInfo.catalogPermission.enough(catalog.name, editCatalogPermission)) return false;
		return !allowedBranches.includes(branchStr);
	} catch {
		return false;
	}
};

export default isReadOnlyBranch;
