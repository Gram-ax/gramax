import ModalToOpenService from "@core-ui/ContextServices/ModalToOpenService/ModalToOpenService";
import ModalToOpen from "@core-ui/ContextServices/ModalToOpenService/model/ModalsToOpen";
import SourceDataService from "@core-ui/ContextServices/SourceDataService";
import type ConfluenceSourceData from "@ext/confluence/core/model/ConfluenceSourceData";
import Mode from "@ext/git/actions/Clone/model/Mode";
import type GitHubSourceData from "@ext/git/actions/Source/GitHub/logic/GitHubSourceData";
import type GitLabSourceData from "@ext/git/core/model/GitLabSourceData.schema";
import type NotionSourceData from "@ext/notion/model/NotionSourceData";
import { useCallback } from "react";
import type SourceData from "../model/SourceData";

export const useOpenRestoreSourceTokenModal = (source: SourceData) => {
	const sourceDatas = SourceDataService.value;

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
			onClose: () => ModalToOpenService.resetValue(),
		});
	}, [source, sourceDatas]);
};
