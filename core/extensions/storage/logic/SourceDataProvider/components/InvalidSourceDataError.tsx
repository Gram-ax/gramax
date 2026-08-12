import SourceDataService from "@core-ui/ContextServices/SourceDataService";
import { useIsEnterprise } from "@ext/enterprise/utils/useIsEnterprise";
import { DialogErrorHeader } from "@ext/errorHandlers/client/components/DialogErrorHeader";
import type GetErrorComponent from "@ext/errorHandlers/logic/GetErrorComponent";
import t from "@ext/localization/locale/translate";
import useSourceData from "@ext/storage/components/useSourceData";
import { useOpenRestoreSourceTokenModal } from "@ext/storage/logic/SourceDataProvider/components/useOpenRestoreSourceTokenModal";
import getStorageNameByData from "@ext/storage/logic/utils/getStorageNameByData";
import { AlertConfirm } from "@ui-kit/AlertDialog";
import { DialogBody, DialogFooterTemplate } from "@ui-kit/Dialog";
import { type ComponentProps, useEffect } from "react";

const InvalidSourceDataError = ({ error, onCancelClick }: ComponentProps<typeof GetErrorComponent>) => {
	const isEnterprise = useIsEnterprise();
	if (isEnterprise)
		return (
			<AlertConfirm
				cancelText={t("close")}
				description={t("forms.clone-repo.errors.connect")}
				icon="alert-circle"
				onCancel={onCancelClick}
				status="error"
				title={t("forms.add-storage.name2")}
			/>
		);

	const sourceDatas = SourceDataService.value;

	useEffect(() => {
		const sourceIndex = sourceDatas.findIndex((s) => getStorageNameByData(s) === error.props?.sourceName);
		if (sourceIndex === -1) return;
		sourceDatas[sourceIndex].isInvalid = true;
		SourceDataService.value = [...sourceDatas];
	}, [error.props?.sourceName]);

	const source = useSourceData(error.props?.sourceName as string);
	const openRestoreSourceModal = useOpenRestoreSourceTokenModal(source);

	const onConnect = () => {
		onCancelClick?.();
		openRestoreSourceModal();
	};

	return (
		<>
			<DialogErrorHeader error={error} icon="key-round" title={t("storage-not-connected")} />
			<DialogBody>
				<div className="article !bg-transparent">
					<p>{t("git.source.error.invalid-credentials.desc")}</p>
				</div>
			</DialogBody>
			<DialogFooterTemplate
				primaryButton={source ? t("connect-storage") : t("close")}
				primaryButtonProps={{ onClick: source ? onConnect : onCancelClick }}
				secondaryButton={source ? t("close") : undefined}
				secondaryButtonProps={source ? { onClick: onCancelClick, variant: "outline" as const } : undefined}
			/>
		</>
	);
};

export default InvalidSourceDataError;
