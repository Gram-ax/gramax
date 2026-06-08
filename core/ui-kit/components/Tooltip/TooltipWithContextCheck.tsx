import { Tooltip as UiKitTooltip, TooltipProvider as UiKitTooltipProvider } from "ics-ui-kit/components/tooltip";
import { type ComponentPropsWithoutRef, createContext, useContext } from "react";

const TooltipProviderContext = createContext<true | undefined>(undefined);

export const TooltipProvider = (props: ComponentPropsWithoutRef<typeof UiKitTooltipProvider>) => {
	return (
		<TooltipProviderContext.Provider value={true}>
			<UiKitTooltipProvider {...props} />
		</TooltipProviderContext.Provider>
	);
};

export const Tooltip = (props: ComponentPropsWithoutRef<typeof UiKitTooltip>) => {
	const isInsideProvider = useContext(TooltipProviderContext);
	if (!isInsideProvider) {
		console.error("[Tooltip] Tooltip rendered outside of TooltipProvider context.");
	}
	return <UiKitTooltip {...props} />;
};
