import ModalToOpenService from "@core-ui/ContextServices/ModalToOpenService/ModalToOpenService";
import ModalToOpen from "@core-ui/ContextServices/ModalToOpenService/model/ModalsToOpen";
import SourceDataService from "@core-ui/ContextServices/SourceDataService";
import CloneModal from "@ext/git/actions/Clone/components/CloneModal";
import ImportModal from "@ext/import/components/ImportModal";
import CreateStorageModal from "@ext/storage/components/CreateStorageModal";
import isGitSourceType from "@ext/storage/logic/SourceDataProvider/logic/isGitSourceType";
import getStorageNameByData from "@ext/storage/logic/utils/getStorageNameByData";
import { ComponentProps, useCallback } from "react";

export const useButtonsHandlers = () => {
	const sourceDatas = SourceDataService.value;
	const isEmptyCloneData = !sourceDatas.some((data) => isGitSourceType(data.sourceType));

	const onCloneClick = useCallback(() => {
		if (isEmptyCloneData) {
			ModalToOpenService.setValue<ComponentProps<typeof CreateStorageModal>>(ModalToOpen.CreateStorage, {
				onSubmit: (data) => {
					ModalToOpenService.setValue<ComponentProps<typeof CloneModal>>(ModalToOpen.Clone, {
						selectedStorage: getStorageNameByData(data),
						onClose: () => ModalToOpenService.resetValue(),
					});
				},
				onClose: () => ModalToOpenService.resetValue(),
			});
		} else {
			ModalToOpenService.setValue<ComponentProps<typeof CloneModal>>(ModalToOpen.Clone, {
				onSubmit: () => ModalToOpenService.resetValue(),
				onClose: () => ModalToOpenService.resetValue(),
			});
		}
	}, [isEmptyCloneData]);

	const onImportClick = useCallback(() => {
		ModalToOpenService.setValue<ComponentProps<typeof ImportModal>>(ModalToOpen.ImportModal, {
			onClose: () => ModalToOpenService.resetValue(),
		});
	}, []);

	return {
		onCloneClick,
		onImportClick,
	};
};
