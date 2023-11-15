import { ComponentProps } from "react";
import ErrorForm from "../../../../../errorHandlers/client/components/ErrorForm";
import GetErrorComponent from "../../../../../errorHandlers/logic/GetErrorComponent";
import useLocalize from "../../../../../localization/useLocalize";

const CheckoutConflictErrorComponent = ({ onCancelClick }: ComponentProps<typeof GetErrorComponent>) => {
	return (
		<ErrorForm
			onCancelClick={onCancelClick}
			title={useLocalize("checkoutError")}
			closeButton={{ text: useLocalize("ok") }}
		>
			<span>{useLocalize("checkoutConflict")}</span>
		</ErrorForm>
	);
};

export default CheckoutConflictErrorComponent;
