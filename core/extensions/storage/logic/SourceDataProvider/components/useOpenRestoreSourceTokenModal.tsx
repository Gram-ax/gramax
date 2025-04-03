import ModalToOpenService from "@core-ui/ContextServices/ModalToOpenService/ModalToOpenService";
import ModalToOpen from "@core-ui/ContextServices/ModalToOpenService/model/ModalsToOpen";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import type ConfluenceSourceData from "@ext/confluence/core/model/ConfluenceSourceData";
import Mode from "@ext/git/actions/Clone/model/Mode";
import type GitHubSourceData from "@ext/git/actions/Source/GitHub/logic/GitHubSourceData";
import type GitLabSourceData from "@ext/git/core/model/GitLabSourceData.schema";
import type NotionSourceData from "@ext/notion/model/NotionSourceData";
import getStorageNameByData from "@ext/storage/logic/utils/getStorageNameByData";
import { useCallback } from "react";
import type SourceData from "../model/SourceData";

export const useOpenRestoreSourceTokenModal = (source: SourceData) => {
	const pageData = PageDataContextService.value;

	return useCallback(() => {
		const clonedSourceData = source ? { ...source } : null;

		if (clonedSourceData) {
			delete (clonedSourceData as GitLabSourceData | ConfluenceSourceData | GitHubSourceData | NotionSourceData)
				.token;
			delete (clonedSourceData as GitHubSourceData).refreshToken;
		}

		ModalToOpenService.resetValue();
		ModalToOpenService.setValue(ModalToOpen.CreateSourceData, {
			defaultSourceData: clonedSourceData,
			defaultSourceType: clonedSourceData?.sourceType,
			mode: Mode.init,
			onCreate: (data: SourceData) => {
				const name = getStorageNameByData(data);
				const index = pageData.sourceDatas.findIndex((s) => getStorageNameByData(s) === name);
				if (index !== -1) {
					pageData.sourceDatas[index] = data;
					PageDataContextService.value = { ...pageData };
				}
			},
			onClose: () => ModalToOpenService.resetValue(),
		});
	}, [source]);
};
