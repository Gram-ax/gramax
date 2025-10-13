import { TabsTrigger as UiKitTabsTrigger } from "ics-ui-kit/components/tabs";
import { ExtractComponentGeneric } from "../../lib/extractComponentGeneric";
import { forwardRef } from "react";

type UiKitTabsTriggerProps = ExtractComponentGeneric<typeof UiKitTabsTrigger>;

export type TabsTriggerProps = UiKitTabsTriggerProps;

export const TabsTrigger = forwardRef<HTMLButtonElement, TabsTriggerProps>((props, ref) => {
	return <UiKitTabsTrigger ref={ref} data-qa={"qa-clickable"} {...props} />;
});
