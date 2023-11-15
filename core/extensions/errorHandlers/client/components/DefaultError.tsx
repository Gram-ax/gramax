import { ComponentProps } from "react";
import useLocalize from "../../../localization/useLocalize";
import GetErrorComponent from "../../logic/GetErrorComponent";
import ErrorForm from "./ErrorForm";

const DefaultErrorComponent = ({ error, onCancelClick }: ComponentProps<typeof GetErrorComponent>) => {
	return (
		<ErrorForm
			onCancelClick={onCancelClick}
			title={useLocalize("error")}
			icon={{ code: "circle-xmark", color: "var(--color-danger)" }}
		>
			<span>{error.message}</span>
		</ErrorForm>
	);
};

export default DefaultErrorComponent;
