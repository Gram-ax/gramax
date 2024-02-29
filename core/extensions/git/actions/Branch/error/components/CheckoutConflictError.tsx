import { ComponentProps } from "react";
import InfoModalForm from "../../../../../errorHandlers/client/components/ErrorForm";
import GetErrorComponent from "../../../../../errorHandlers/logic/GetErrorComponent";
import useLocalize from "../../../../../localization/useLocalize";

const CheckoutConflictErrorComponent = ({ onCancelClick }: ComponentProps<typeof GetErrorComponent>) => {
	return (
		<InfoModalForm
			onCancelClick={onCancelClick}
			title={useLocalize("checkoutError")}
			closeButton={{ text: useLocalize("ok") }}
		>
			<span>{useLocalize("checkoutConflict")}</span>
		</InfoModalForm>
	);
};

export default CheckoutConflictErrorComponent;
