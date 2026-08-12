import { getIcon } from "@ext/errorHandlers/client/components/DefaultError";
import type DefaultError from "@ext/errorHandlers/logic/DefaultError";
import t from "@ext/localization/locale/translate";
import { DialogHeader, DialogTitle } from "@ui-kit/Dialog";
import { Icon } from "@ui-kit/Icon";

export interface DialogErrorHeaderProps {
	title?: string;
	icon?: string;
	color?: string;
	error?: Pick<DefaultError, "icon" | "isWarning" | "title">;
}

export const DialogErrorHeader = ({ error, title, icon: iconProps, color }: DialogErrorHeaderProps) => {
	const icon = iconProps || (error && getIcon(error));
	const newTitle = title || error?.title || (error?.isWarning && t("warning")) || t("error");
	return (
		<DialogHeader className="flex items-center gap-2">
			{icon && (
				<Icon
					className="shrink-0"
					color={typeof icon === "string" ? color : icon.color}
					icon={typeof icon === "string" ? icon : icon.code}
					size="xl"
				/>
			)}
			<DialogTitle>{newTitle}</DialogTitle>
		</DialogHeader>
	);
};
