import { ComponentProps } from "react";
import useLocalize from "../../../localization/useLocalize";
import GetErrorComponent from "../../logic/GetErrorComponent";
import InfoModalForm from "./ErrorForm";

const DefaultErrorComponent = ({ error, onCancelClick }: ComponentProps<typeof GetErrorComponent>) => {
	return (
		<InfoModalForm
			onCancelClick={onCancelClick}
			title={useLocalize("error")}
			icon={{ code: "circle-xmark", color: "var(--color-danger)" }}
		>
			<span>{error.message}</span>
		</InfoModalForm>
	);
};

export default DefaultErrorComponent;
