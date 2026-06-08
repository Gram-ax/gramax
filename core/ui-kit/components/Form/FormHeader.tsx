import LucideIcon from "@components/Atoms/Icon/LucideIcon";
import styled from "@emotion/styled";
import { DialogDescription, DialogTitle } from "@ui-kit/Dialog";
import { FormHeaderTemplate as UiKitFormHeaderTemplate } from "ics-ui-kit/components/form";
import type { FC } from "react";
import type { ExtractComponentGeneric } from "../../lib/extractComponentGeneric";

type UiKitFormHeaderTemplateProps = ExtractComponentGeneric<typeof UiKitFormHeaderTemplate>;

interface FormHeaderTemplateProps extends Omit<UiKitFormHeaderTemplateProps, "icon" | "description"> {
	icon?: string;
	iconColor?: string;
	description?: JSX.Element | string;
}

const NonStyledFormHeader: FC<FormHeaderTemplateProps> = (props) => {
	const { icon, title, description, iconColor, ...otherProps } = props;
	const Icon = icon && LucideIcon(icon);

	return (
		<UiKitFormHeaderTemplate
			{...otherProps}
			data-icon-color={iconColor}
			description={description && <DialogDescription>{description}</DialogDescription>}
			// biome-ignore lint/suspicious/noExplicitAny: expected
			icon={Icon as any}
			title={<DialogTitle>{title}</DialogTitle>}
		/>
	);
};

export const FormHeader = styled(NonStyledFormHeader)`
	&[data-icon-color] {
		svg {
			color: ${(p) => p.iconColor};
		}
	}
`;
