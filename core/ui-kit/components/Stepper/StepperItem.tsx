import { StepperItem as UiKitStepperItem } from "ics-ui-kit/components/stepper";
import type { FC, ReactNode } from "react";
import type { ExtractComponentGeneric } from "../../lib/extractComponentGeneric";

type UiKitStepperItemProps = Omit<ExtractComponentGeneric<typeof UiKitStepperItem>, "step"> & {
	step?: ReactNode;
};

interface StepperItemProps extends UiKitStepperItemProps {}

export const StepperItem: FC<StepperItemProps> = (props) => {
	// biome-ignore lint/suspicious/noExplicitAny: expected
	return <UiKitStepperItem step={props.step as any} {...props} data-testid="stepper-item" />;
};
