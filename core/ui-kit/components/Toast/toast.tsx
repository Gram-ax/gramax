import Icon from "@components/Atoms/Icon";
import { toast as toastIcs } from "ics-ui-kit/components/toast";

export type ToastOptions = Parameters<typeof toastIcs>[1] & {
	icon?: string;
};

export const toast = (message: string, options: ToastOptions) => {
	const { icon, ...otherOptions } = options;
	return toastIcs(message, {
		...otherOptions,
		icon: icon ? <Icon code={icon} style={{ verticalAlign: "top" }} /> : undefined,
	});
};
