import LucideIcon from "@components/Atoms/Icon/LucideIcon";
import { Retry as UiKitRetry } from "ics-ui-kit/components/error-state";
import { FC } from "react";
import { ExtractComponentGeneric } from "../../lib/extractComponentGeneric";

type UiKitRetryProps = ExtractComponentGeneric<typeof UiKitRetry>;

interface RetryProps extends Omit<UiKitRetryProps, "startIcon"> {
	startIcon?: string;
}

export const Retry: FC<RetryProps> = (props) => {
	const { startIcon, ...rest } = props;
	const StartIcon = startIcon && LucideIcon(startIcon);
	return <UiKitRetry {...rest} startIcon={StartIcon as any} />;
};
