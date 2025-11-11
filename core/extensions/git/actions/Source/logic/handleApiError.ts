import NetworkApiError from "@ext/errorHandlers/network/NetworkApiError";
import t from "@ext/localization/locale/translate";
import { UseFormReturn } from "react-hook-form";

const handleFormApiError = (error: NetworkApiError, form: UseFormReturn) => {
	if (!(error instanceof NetworkApiError)) return;
	switch (error.props.status) {
		case 401:
		case 403: {
			form.setError("token", { type: "invalid", message: t("invalid2") + " " + t("token") });
			break;
		}
		case -1: {
			form.setError("url", { message: t("git.connect-source.error.unable-to-connect") });
			break;
		}
		default: {
			form.setError("url", { message: t("invalid") + " " + t("value") });
			break;
		}
	}
};

export default handleFormApiError;
