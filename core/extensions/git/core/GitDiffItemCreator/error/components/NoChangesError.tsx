import { ComponentProps } from "react";
import InfoModalForm from "../../../../../errorHandlers/client/components/ErrorForm";
import GetErrorComponent from "../../../../../errorHandlers/logic/GetErrorComponent";
import useLocalize from "../../../../../localization/useLocalize";

const NoChangesErrorComponent = (args: ComponentProps<typeof GetErrorComponent>) => {
	return (
		<InfoModalForm
			{...args}
			title={useLocalize("warning")}
			icon={{ code: "alert-circle", color: "var(--color-admonition-note-br-h)" }}
			isError={false}
		>
			<span>{useLocalize("noChangesInCatalog")}</span>
		</InfoModalForm>
	);
};

export default NoChangesErrorComponent;
