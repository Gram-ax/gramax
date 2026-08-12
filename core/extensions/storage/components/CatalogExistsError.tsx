import ModalToOpenService from "@core-ui/ContextServices/ModalToOpenService/ModalToOpenService";
import ModalToOpen from "@core-ui/ContextServices/ModalToOpenService/model/ModalsToOpen";
import { DialogErrorHeader } from "@ext/errorHandlers/client/components/DialogErrorHeader";
import t from "@ext/localization/locale/translate";
import type { AppSettingsEditorProps } from "@ext/settings/components/AppSettingsEditor";
import { Level } from "@ext/settings/logic/settings";
import { DialogBody, DialogFooterTemplate } from "@ui-kit/Dialog";
import type { GetErrorComponentProps } from "../../errorHandlers/logic/GetErrorComponent";

const CatalogExistsError = ({ error, onCancelClick }: GetErrorComponentProps) => {
	const formatError = () => {
		if (!error.props?.storage) return error.message;
		const parts = t("catalog.error.already-exist-2").split("%");
		return (
			<div className="article !bg-transparent">
				{parts[0]}
				<code>{error.props.storage}</code>
				{parts[1]}
				<code>{error.props.name}</code>
				{parts[2]}
			</div>
		);
	};

	const onConfigure = () => {
		ModalToOpenService.setValue<AppSettingsEditorProps>(ModalToOpen.AppSettings, {
			defaultLevel: Level.catalog,
			onClose: () => ModalToOpenService.resetValue(),
			onCatalogSubmit: onCancelClick,
			modalContentProps: { "data-upper-error": true },
		});
	};

	return (
		<>
			<DialogErrorHeader
				color="var(--color-danger)"
				error={error}
				icon="alert-circle"
				title={t("catalog.error.already-exist")}
			/>
			<DialogBody>{formatError()}</DialogBody>
			<DialogFooterTemplate
				primaryButton={t("catalog.configure")}
				primaryButtonProps={{ onClick: onConfigure }}
				secondaryButton={t("close")}
				secondaryButtonProps={{ onClick: onCancelClick, variant: "outline" }}
			/>
		</>
	);
};

export default CatalogExistsError;
