import RichText from "@components/Atoms/RichText/RichText";
import { DialogErrorHeader } from "@ext/errorHandlers/client/components/DialogErrorHeader";
import type GetErrorComponent from "@ext/errorHandlers/logic/GetErrorComponent";
import t from "@ext/localization/locale/translate";
import { DialogBody, DialogFooterTemplate } from "@ui-kit/Dialog";
import type { ComponentProps } from "react";

const LogoutFailed = ({ error, onCancelClick }: ComponentProps<typeof GetErrorComponent>) => {
	return (
		<>
			<DialogErrorHeader error={error} />
			<DialogBody>
				<RichText text={t("enterprise.logout.error-message").replace("{url}", error.props.url)} />
			</DialogBody>
			<DialogFooterTemplate primaryButton={t("ok")} primaryButtonProps={{ onClick: onCancelClick }} />
		</>
	);
};

export default LogoutFailed;
