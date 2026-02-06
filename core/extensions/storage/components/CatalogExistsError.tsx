import ModalToOpenService from "@core-ui/ContextServices/ModalToOpenService/ModalToOpenService";
import ModalToOpen from "@core-ui/ContextServices/ModalToOpenService/model/ModalsToOpen";
import CatalogPropsEditor from "@ext/catalog/actions/propsEditor/components/CatalogPropsEditor";
import InfoModalForm from "@ext/errorHandlers/client/components/ErrorForm";
import GetErrorComponent from "@ext/errorHandlers/logic/GetErrorComponent";
import t from "@ext/localization/locale/translate";
import { ComponentProps } from "react";

const CatalogExistsError = ({ error, onCancelClick }: ComponentProps<typeof GetErrorComponent>) => {
	const formatError = () => {
		if (!error.props?.storage) return error.message;
		const parts = t("catalog.error.already-exist-2").split("%");
		return (
			<div className="article">
				{parts[0]}
				<code>{error.props.storage}</code>
				{parts[1]}
				<code>{error.props.name}</code>
				{parts[2]}
			</div>
		);
	};

	return (
		<InfoModalForm
			actionButton={{
				text: t("catalog.configure"),
				onClick: () => {
					ModalToOpenService.setValue<ComponentProps<typeof CatalogPropsEditor>>(
						ModalToOpen.CatalogPropsEditor,
						{
							onClose: () => ModalToOpenService.resetValue(),
							onSubmit: onCancelClick,
							modalContentProps: { "data-upper-error": true },
						},
					);
				},
			}}
			closeButton={{ text: t("close") }}
			icon={{ code: "alert-circle", color: "var(--color-danger)" }}
			onCancelClick={onCancelClick}
			title={t("catalog.error.already-exist")}
		>
			{formatError()}
		</InfoModalForm>
	);
};

export default CatalogExistsError;
