import CatalogPropsEditor from "@ext/catalog/actions/propsEditor/components/CatalogPropsEditor";
import InfoModalForm from "@ext/errorHandlers/client/components/ErrorForm";
import GetErrorComponent from "@ext/errorHandlers/logic/GetErrorComponent";
import t from "@ext/localization/locale/translate";
import { ComponentProps, useState } from "react";

const CatalogExistsError = ({ error, onCancelClick }: ComponentProps<typeof GetErrorComponent>) => {
	const [isSettingsOpen, setIsSettingsOpen] = useState(false);

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
		<>
			<InfoModalForm
				onCancelClick={onCancelClick}
				title={t("catalog.error.already-exist")}
				actionButton={{
					text: t("catalog.configure"),
					onClick: () => setIsSettingsOpen(true),
				}}
				closeButton={{ text: t("close") }}
				icon={{ code: "alert-circle", color: "var(--color-danger)" }}
			>
				{formatError()}
			</InfoModalForm>
			<CatalogPropsEditor
				onClose={() => setIsSettingsOpen(false)}
				onSubmit={onCancelClick}
				isOpen={isSettingsOpen}
			/>
		</>
	);
};

export default CatalogExistsError;
