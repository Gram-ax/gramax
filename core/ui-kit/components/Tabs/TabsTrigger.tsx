import { TabsTrigger as UiKitTabsTrigger } from "ics-ui-kit/components/tabs";
import { forwardRef } from "react";
import { ExtractComponentGeneric } from "../../lib/extractComponentGeneric";

type UiKitTabsTriggerProps = ExtractComponentGeneric<typeof UiKitTabsTrigger>;

export type TabsTriggerProps = UiKitTabsTriggerProps;

export const TabsTrigger = forwardRef<HTMLButtonElement, TabsTriggerProps>((props, ref) => {
	return <UiKitTabsTrigger data-qa={"qa-clickable"} ref={ref} {...props} />;
});
