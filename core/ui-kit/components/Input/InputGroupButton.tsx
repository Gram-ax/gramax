import LucideIcon from "@components/Atoms/Icon/LucideIcon";
import { InputGroupButton as UiKitInputGroupButton } from "ics-ui-kit/components/input";
import { FC } from "react";
import { ExtractComponentGeneric } from "../../lib/extractComponentGeneric";

type UiKitInputGroupButtonProps = ExtractComponentGeneric<typeof UiKitInputGroupButton>;

interface InputGroupButtonProps extends Omit<UiKitInputGroupButtonProps, "icon"> {
	icon?: string;
}

export const InputGroupButton: FC<InputGroupButtonProps> = (props) => {
	const { icon, ...otherProps } = props;
	const Icon = icon && LucideIcon(icon);
	return <UiKitInputGroupButton icon={Icon as any} {...otherProps} />;
};
