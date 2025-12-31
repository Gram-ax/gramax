import Context from "@core/Context/Context";
import EnterpriseApi from "@ext/enterprise/EnterpriseApi";
import EnterpriseUser from "@ext/enterprise/EnterpriseUser";
import DefaultError from "@ext/errorHandlers/logic/DefaultError";
import GitStorageData from "@ext/git/core/model/GitStorageData";
import t from "@ext/localization/locale/translate";
import AuthManager from "@ext/security/logic/AuthManager";
import SourceType from "@ext/storage/logic/SourceDataProvider/model/SourceType";
import StorageData from "@ext/storage/models/StorageData";

const EnterpriseSources: SourceType[] = [SourceType.gitLab];

export const initEnterpriseStorage = async (
	gesUrl: string,
	storageData: StorageData,
	ctx: Context,
	am: AuthManager,
) => {
	if (!gesUrl) return;
	if (!EnterpriseSources.includes(storageData.source.sourceType)) return;

	const gitStorageData = storageData as GitStorageData;
	if (!gesUrl.includes(gitStorageData.source.domain)) return;

	const res = await new EnterpriseApi(gesUrl).initStorage(
		gitStorageData.source.token,
		`${gitStorageData.group}/${gitStorageData.name}`,
	);
	if (!res) throw new DefaultError(t("enterprise.init-repo.error"));

	if (ctx.user.type === "enterprise") {
		const enterpriseUser = ctx.user as EnterpriseUser;
		const updatedUser = await enterpriseUser.updatePermissions(false, true);
		if (!updatedUser) return;
		am.setUser(ctx.cookie, updatedUser);
		am.setUsersEnterpriseInfo(updatedUser, ctx.cookie);
	}
};
