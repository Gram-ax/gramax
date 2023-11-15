import { ComponentProps } from "react";
import ErrorForm from "../../../../../errorHandlers/client/components/ErrorForm";
import GetErrorComponent from "../../../../../errorHandlers/logic/GetErrorComponent";
import useLocalize from "../../../../../localization/useLocalize";

const NoChangesErrorComponent = (args: ComponentProps<typeof GetErrorComponent>) => {
	return (
		<ErrorForm
			{...args}
			title={useLocalize("warning")}
			icon={{ code: "circle-exclamation", color: "var(--color-admonition-note-br-h)" }}
		>
			<span>{useLocalize("noChangesInCatalog")}</span>
		</ErrorForm>
	);
};

export default NoChangesErrorComponent;
