import { DialogErrorHeader } from "@ext/errorHandlers/client/components/DialogErrorHeader";
import t from "@ext/localization/locale/translate";
import { DialogBody, DialogFooterTemplate } from "@ui-kit/Dialog";
import type { GetErrorComponentProps } from "../../../../../errorHandlers/logic/GetErrorComponent";

const CheckoutConflictErrorComponent = ({ onCancelClick, error }: GetErrorComponentProps) => {
	return (
		<>
			<DialogErrorHeader error={error} title={t("git.checkout.error.conflict")} />
			<DialogBody>
				<span>{t("git.checkout.conflict")}</span>
			</DialogBody>
			<DialogFooterTemplate primaryButton={t("ok")} primaryButtonProps={{ onClick: onCancelClick }} />
		</>
	);
};

export default CheckoutConflictErrorComponent;
