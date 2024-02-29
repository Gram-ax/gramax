import { makeSourceApi } from "@ext/git/actions/Source/makeSourceApi";
import type GitStorageData from "@ext/git/core/model/GitStorageData";
import SourceType from "@ext/storage/logic/SourceDataProvider/model/SourceType";
import CatalogExistsError from "@ext/storage/models/CatalogExistsError";
import type StorageData from "@ext/storage/models/StorageData";

const assertStorageExists = async (data: StorageData, authServiceUrl: string) => {
	if (await makeSourceApi(data.source, authServiceUrl).isRepositoryExists(data)) {
		if (!(data.source.sourceType == SourceType.gitHub || data.source.sourceType == SourceType.gitLab))
			throw new CatalogExistsError(data.name, data.name);

		throw new CatalogExistsError(
			(data as GitStorageData).source.domain + "/" + (data as GitStorageData).group,
			data.name,
		);
	}
};

export default assertStorageExists;
