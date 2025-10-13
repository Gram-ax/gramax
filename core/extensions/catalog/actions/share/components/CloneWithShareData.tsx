import SmallFence from "@components/Labels/SmallFence";
import ModalToOpenService from "@core-ui/ContextServices/ModalToOpenService/ModalToOpenService";
import ModalToOpen from "@core-ui/ContextServices/ModalToOpenService/model/ModalsToOpen";
import SourceDataService from "@core-ui/ContextServices/SourceDataService";
import convertShareLinkDataToStorageData from "@ext/catalog/actions/share/logic/convertShareLinkDataToStorageData";
import ShareData from "@ext/catalog/actions/share/model/ShareData";
import InfoModalForm from "@ext/errorHandlers/client/components/ErrorForm";
import { useCloneRepo } from "@ext/git/actions/Clone/logic/useCloneRepo";
import GitShareData from "@ext/git/core/model/GitShareData";
import t from "@ext/localization/locale/translate";
import CreateStorageModal from "@ext/storage/components/CreateStorageModal";
import SourceData from "@ext/storage/logic/SourceDataProvider/model/SourceData";
import SourceType from "@ext/storage/logic/SourceDataProvider/model/SourceType";
import getPartGitSourceDataByStorageName from "@ext/storage/logic/utils/getPartSourceDataByStorageName";
import getSourceDataByStorageName from "@ext/storage/logic/utils/getSourceDataByStorageName";
import getStorageNameByData from "@ext/storage/logic/utils/getStorageNameByData";
import { ComponentProps, useEffect, useState } from "react";

interface CloneWithShareDataProps {
	shareData: ShareData;
	onCloneStart?: VoidFunction;
	onCloneError?: VoidFunction;
	clonePath?: string;
	onCreateSourceDataClose?: (success: boolean) => void;
}

const CloneWithShareData = (props: CloneWithShareDataProps) => {
	const { shareData, onCloneStart, onCloneError, clonePath, onCreateSourceDataClose } = props;
	const [hasStorageInitialized, setHasStorageInitialized] = useState(false);
	const [partSourceData, setPartSourceData] = useState<Partial<SourceData>>(null);

	const sourceDatas = SourceDataService.value;

	const getBranch = () => {
		if (!shareData) return;

		if (shareData.sourceType === SourceType.gitHub || shareData.sourceType === SourceType.gitLab) {
			return (shareData as GitShareData).branch;
		}
	};

	const getPartSourceData = () => {
		if (shareData && (shareData.sourceType === SourceType.gitHub || shareData.sourceType === SourceType.gitLab)) {
			return getPartGitSourceDataByStorageName((shareData as GitShareData).domain).data;
		}
		return {};
	};

	useEffect(() => {
		if (!shareData) return;
		const shareLinkStorageName = getStorageNameByData(shareData);
		const res = getSourceDataByStorageName(shareLinkStorageName, sourceDatas);
		if (res) {
			startClone({
				storageData: convertShareLinkDataToStorageData(res, shareData),
			});
		} else {
			setPartSourceData(getPartSourceData());
			setHasStorageInitialized(false);
		}
	}, [shareData]);

	const domain = (
		<div style={{ display: "inline-flex" }}>
			<SmallFence overflow="hidden" fixWidth value={(shareData as GitShareData)?.domain} />
		</div>
	);

	const openCreateStorageModal = () => {
		ModalToOpenService.setValue<ComponentProps<typeof CreateStorageModal>>(ModalToOpen.CreateStorage, {
			isReadonly: true,
			data: partSourceData,
			sourceType: shareData.sourceType || SourceType.git,
			onClose: () => ModalToOpenService.resetValue(),
			onSubmit: (data) => {
				startClone({
					storageData: convertShareLinkDataToStorageData(data, shareData),
				});
			},
		});
	};

	const createSourceDataWarning = (
		<InfoModalForm
			isWarning={true}
			title={t("clone-fail")}
			onCancelClick={() => onCreateSourceDataClose?.(false)}
			actionButton={{
				onClick: () => openCreateStorageModal(),
				text: t("add-storage"),
			}}
		>
			<div>
				{t("no-access-to-storage")} {domain}. {t("add-to-continue-downloading")}
			</div>
		</InfoModalForm>
	);

	useEffect(() => {
		const keydownHandler = (e: KeyboardEvent) => {
			if (!(e.code === "Enter" && (e.ctrlKey || e.metaKey))) return;
			openCreateStorageModal();
		};
		window.addEventListener("keydown", keydownHandler);
		return () => window.removeEventListener("keydown", keydownHandler);
	}, []);

	const { startClone } = useCloneRepo({
		branch: getBranch(),
		redirectOnClone: clonePath,
		skipCheck: true,
		onError: onCloneError,
		onStart: () => {
			refreshPage();
			onCloneStart?.();
		},
	});

	if (hasStorageInitialized) return null;
	return partSourceData && createSourceDataWarning;
};

export default CloneWithShareData;
