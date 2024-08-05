import t from "@ext/localization/locale/translate";
import { ComponentProps } from "react";
import InfoModalForm from "../../../../../errorHandlers/client/components/ErrorForm";
import GetErrorComponent from "../../../../../errorHandlers/logic/GetErrorComponent";

const CheckoutConflictErrorComponent = ({ onCancelClick }: ComponentProps<typeof GetErrorComponent>) => {
	return (
		<InfoModalForm onCancelClick={onCancelClick} title={t("checkout-error")} closeButton={{ text: t("ok") }}>
			<span>{t("git.checkout.conflict")}</span>
		</InfoModalForm>
	);
};

export default CheckoutConflictErrorComponent;
