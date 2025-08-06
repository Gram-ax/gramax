import LucideIcon from "@components/Atoms/Icon/LucideIcon";
import { ProgressIconButton as UiKitProgressIconButton } from "ics-ui-kit/components/progress";
import { ExtractComponentGeneric } from "../../lib/extractComponentGeneric";

type UiKitProgressIconButtonProps = ExtractComponentGeneric<typeof UiKitProgressIconButton>;

interface ProgressIconButtonProps extends Omit<UiKitProgressIconButtonProps, "icon"> {
	icon: string;
}

export const ProgressIconButton = (props: ProgressIconButtonProps) => {
	const { icon, ...otherProps } = props;
	const lucideIcon = LucideIcon(icon);

	return <UiKitProgressIconButton icon={lucideIcon as any} {...otherProps} />;
};
