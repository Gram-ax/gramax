import type Context from "@core/Context/Context";
import EnterpriseApi from "@ext/enterprise/EnterpriseApi";
import type EnterpriseUser from "@ext/enterprise/EnterpriseUser";
import DefaultError from "@ext/errorHandlers/logic/DefaultError";
import type GitStorageData from "@ext/git/core/model/GitStorageData";
import t from "@ext/localization/locale/translate";
import type AuthManager from "@ext/security/logic/AuthManager";
import ClientAuthManager from "@ext/security/logic/ClientAuthManager";
import SourceType from "@ext/storage/logic/SourceDataProvider/model/SourceType";
import type StorageData from "@ext/storage/models/StorageData";

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
		if (!(am instanceof ClientAuthManager)) return;
		await am.forceUpdateEnterpriseUser(ctx.cookie, enterpriseUser);
	}
};
