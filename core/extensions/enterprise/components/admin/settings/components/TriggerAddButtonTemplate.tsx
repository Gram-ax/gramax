import t from "@ext/localization/locale/translate";
import { Button, ButtonProps } from "@ui-kit/Button";
import { forwardRef } from "react";

export const TriggerAddButtonTemplate = forwardRef<HTMLButtonElement, ButtonProps>(({ ...props }, ref) => {
	return (
		<Button className="ml-auto" ref={ref} startIcon="plus" {...props}>
			{t("add")}
		</Button>
	);
});
