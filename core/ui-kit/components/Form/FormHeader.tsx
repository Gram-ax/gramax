import LucideIcon from "@components/Atoms/Icon/LucideIcon";
import { ModalDescription, ModalTitle } from "@ui-kit/Modal";
import { FormHeaderTemplate as UiKitFormHeaderTemplate } from "ics-ui-kit/components/form";
import { FC } from "react";
import { ExtractComponentGeneric } from "../../lib/extractComponentGeneric";

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
			description={description && <ModalDescription>{description}</ModalDescription>}
			icon={Icon as any}
			title={<ModalTitle>{title}</ModalTitle>}
		/>
	);
};
