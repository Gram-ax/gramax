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
import isGitSourceType from "@ext/storage/logic/SourceDataProvider/logic/isGitSourceType";
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

		if (isGitSourceType(shareData.sourceType)) {
			return (shareData as GitShareData).branch;
		}
	};

	const getPartSourceData = () => {
		if (shareData && isGitSourceType(shareData.sourceType)) {
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
			<SmallFence fixWidth overflow="hidden" value={(shareData as GitShareData)?.domain} />
		</div>
	);

	const sourceType = shareData.sourceType || SourceType.git;

	const openCreateStorageModal = () => {
		ModalToOpenService.setValue<ComponentProps<typeof CreateStorageModal>>(ModalToOpen.CreateStorage, {
			isReadonly: sourceType !== SourceType.git,
			data: partSourceData,
			sourceType,
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
			actionButton={{
				onClick: () => openCreateStorageModal(),
				text: t("add-storage"),
			}}
			isWarning={true}
			onCancelClick={() => onCreateSourceDataClose?.(false)}
			title={t("clone-fail")}
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
