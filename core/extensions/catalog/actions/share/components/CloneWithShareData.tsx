import SmallFence from "@components/Labels/SmallFence";
import ModalToOpenService from "@core-ui/ContextServices/ModalToOpenService/ModalToOpenService";
import ModalToOpen from "@core-ui/ContextServices/ModalToOpenService/model/ModalsToOpen";
import SourceDataService from "@core-ui/ContextServices/SourceDataService";
import convertShareLinkDataToStorageData from "@ext/catalog/actions/share/logic/convertShareLinkDataToStorageData";
import type ShareData from "@ext/catalog/actions/share/model/ShareData";
import { useCloneRepo } from "@ext/git/actions/Clone/logic/useCloneRepo";
import type GitShareData from "@ext/git/core/model/GitShareData";
import t from "@ext/localization/locale/translate";
import type CreateStorageModal from "@ext/storage/components/CreateStorageModal";
import isGitSourceType from "@ext/storage/logic/SourceDataProvider/logic/isGitSourceType";
import type SourceData from "@ext/storage/logic/SourceDataProvider/model/SourceData";
import SourceType from "@ext/storage/logic/SourceDataProvider/model/SourceType";
import getPartGitSourceDataByStorageName from "@ext/storage/logic/utils/getPartSourceDataByStorageName";
import getSourceDataByStorageName from "@ext/storage/logic/utils/getSourceDataByStorageName";
import getStorageNameByData from "@ext/storage/logic/utils/getStorageNameByData";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogIcon,
	AlertDialogTitle,
} from "@ui-kit/AlertDialog";
import { type ComponentProps, useEffect, useState } from "react";

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

	// biome-ignore lint/correctness/useExhaustiveDependencies: expected
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
		<AlertDialog
			onOpenChange={(open) => {
				if (!open) onCreateSourceDataClose?.(false);
			}}
			open={true}
		>
			<AlertDialogContent status="warning">
				<AlertDialogHeader>
					<AlertDialogIcon icon="alert-circle" />
					<AlertDialogTitle>{t("clone-fail")}</AlertDialogTitle>
					<AlertDialogDescription>
						<div>
							{t("no-access-to-storage")} {domain}. {t("add-to-continue-downloading")}
						</div>
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel onClick={() => onCreateSourceDataClose?.(false)}>
						{t("cancel")}
					</AlertDialogCancel>
					<AlertDialogAction
						onClick={(event) => {
							event.preventDefault();
							openCreateStorageModal();
						}}
					>
						{t("add-storage")}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);

	// biome-ignore lint/correctness/useExhaustiveDependencies: expected
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
