import CatalogPropsEditor from "@ext/catalog/actions/propsEditor/components/CatalogPropsEditor";
import InfoModalForm from "@ext/errorHandlers/client/components/ErrorForm";
import GetErrorComponent from "@ext/errorHandlers/logic/GetErrorComponent";
import useLocalize from "@ext/localization/useLocalize";
import { ComponentProps, useState } from "react";

const CatalogExistsError = ({ error, onCancelClick }: ComponentProps<typeof GetErrorComponent>) => {
	const [isSettingsOpen, setIsSettingsOpen] = useState(false);

	const formatError = () => {
		if (!error.props?.storage) return error.message;
		const parts = useLocalize("catalogExistsError").split("%");
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
				title={useLocalize("suchCatalogExists")}
				actionButton={{
					text: useLocalize("catalogSettings"),
					onClick: () => setIsSettingsOpen(true),
				}}
				closeButton={{ text: useLocalize("close") }}
				icon={{ code: "circle-xmark", color: "var(--color-danger)" }}
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
