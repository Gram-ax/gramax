import EnterpriseApi from "@ext/enterprise/EnterpriseApi";
import DefaultError from "@ext/errorHandlers/logic/DefaultError";
import GitStorageData from "@ext/git/core/model/GitStorageData";
import t from "@ext/localization/locale/translate";
import SourceType from "@ext/storage/logic/SourceDataProvider/model/SourceType";
import StorageData from "@ext/storage/models/StorageData";

const EnterpriseSources: SourceType[] = [SourceType.gitLab];

export const initEnterpriseStorage = async (gesUrl: string, storageData: StorageData) => {
	if (!gesUrl) return;
	if (!EnterpriseSources.includes(storageData.source.sourceType)) return;

	const gitStorageData = storageData as GitStorageData;
	if (!gesUrl.includes(gitStorageData.source.domain)) return;

	const res = await new EnterpriseApi(gesUrl).initStorage(
		gitStorageData.source.token,
		`${gitStorageData.group}/${gitStorageData.name}`,
	);
	if (!res) throw new DefaultError(t("enterprise.init-repo.error"));
};
