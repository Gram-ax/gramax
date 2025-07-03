import LucideIcon from "@components/Atoms/Icon/LucideIcon";
import { FormHeaderTemplate as UiKitFormHeaderTemplate } from "ics-ui-kit/components/form";
import { ExtractComponentGeneric } from "../../lib/extractComponentGeneric";
import { FC } from "react";
import { ModalTitle, ModalDescription } from "@ui-kit/Modal";

type UiKitFormHeaderTemplateProps = ExtractComponentGeneric<typeof UiKitFormHeaderTemplate>;

interface FormHeaderTemplateProps extends Omit<UiKitFormHeaderTemplateProps, "icon" | "description"> {
	icon?: string;
	description?: string;
}

export const FormHeader: FC<FormHeaderTemplateProps> = (props) => {
	const { icon, title, description, ...otherProps } = props;
	const Icon = icon && LucideIcon(icon);

	return (
		<UiKitFormHeaderTemplate
			{...otherProps}
			title={<ModalTitle>{title}</ModalTitle>}
			description={description && <ModalDescription>{description}</ModalDescription>}
			icon={Icon as any}
		/>
	);
};
