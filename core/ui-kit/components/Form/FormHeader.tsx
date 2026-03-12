import LucideIcon from "@components/Atoms/Icon/LucideIcon";
import { DialogDescription, DialogTitle } from "@ui-kit/Dialog";
import { FormHeaderTemplate as UiKitFormHeaderTemplate } from "ics-ui-kit/components/form";
import type { FC } from "react";
import type { ExtractComponentGeneric } from "../../lib/extractComponentGeneric";

type UiKitFormHeaderTemplateProps = ExtractComponentGeneric<typeof UiKitFormHeaderTemplate>;

interface FormHeaderTemplateProps extends Omit<UiKitFormHeaderTemplateProps, "icon" | "description"> {
	icon?: string;
	description?: JSX.Element;
}

export const FormHeader: FC<FormHeaderTemplateProps> = (props) => {
	const { icon, title, description, ...otherProps } = props;
	const Icon = icon && LucideIcon(icon);

	return (
		<UiKitFormHeaderTemplate
			{...otherProps}
			description={description && <DialogDescription>{description}</DialogDescription>}
			icon={Icon as any}
			title={<DialogTitle>{title}</DialogTitle>}
		/>
	);
};
