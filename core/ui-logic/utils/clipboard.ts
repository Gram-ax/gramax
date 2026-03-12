import { showPopover } from "@core-ui/showPopover";
import t from "@ext/localization/locale/translate";
import { span, traced } from "@ext/loggers/opentelemetry";

export type CopyToClipboardOptions = {
	showPopover?: boolean;
	success?: string;

	showErrorPopover?: boolean;
	error?: string;
};

export const tryCopyToClipboard = async (
	text: string,
	opts: CopyToClipboardOptions = { showPopover: true, showErrorPopover: true },
): Promise<boolean> => {
	return await traced("tryCopyToClipboard", { args: [text] }, async () => {
		try {
			await navigator.clipboard.writeText(text);
			if (opts?.showPopover || typeof opts?.showPopover !== "boolean")
				showPopover(opts?.success || t("share.popover"));

			return true;
		} catch (error) {
			span()?.recordException(error);
			if (opts?.showErrorPopover || typeof opts?.showErrorPopover !== "boolean")
				showPopover(opts?.error || t("share.error.failed-to-copy"));

			return false;
		}
	});
};
