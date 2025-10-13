import ModalToOpenService from "@core-ui/ContextServices/ModalToOpenService/ModalToOpenService";
import ModalToOpen from "@core-ui/ContextServices/ModalToOpenService/model/ModalsToOpen";
import SourceDataService from "@core-ui/ContextServices/SourceDataService";
import type ConfluenceSourceData from "@ext/confluence/core/model/ConfluenceSourceData";
import type GitHubSourceData from "@ext/git/actions/Source/GitHub/logic/GitHubSourceData";
import type GitLabSourceData from "@ext/git/core/model/GitLabSourceData.schema";
import type NotionSourceData from "@ext/notion/model/NotionSourceData";
import { ComponentProps, useCallback } from "react";
import type SourceData from "../model/SourceData";
import t from "@ext/localization/locale/translate";
import getStorageNameByData from "@ext/storage/logic/utils/getStorageNameByData";
import CreateStorageModal from "@ext/storage/components/CreateStorageModal";

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
		ModalToOpenService.setValue<ComponentProps<typeof CreateStorageModal>>(ModalToOpen.CreateStorage, {
			isReadonly: true,
			title: t("forms.add-storage.name2"),
			data: {
				domain: (source as any).domain,
				sourceType: source.sourceType,
				userName: source.userName,
				userEmail: source.userEmail,
			},
			sourceType: clonedSourceData?.sourceType,
			onSubmit: (data) => {
				const storageName = getStorageNameByData(data);
				const newSourceDatas = sourceDatas.filter((d) => getStorageNameByData(d) !== storageName);
				newSourceDatas.push(data);
				SourceDataService.value = newSourceDatas;
			},
			onClose: () => ModalToOpenService.resetValue(),
		});
	}, [source, sourceDatas]);
};
