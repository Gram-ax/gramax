import { Button } from "@ext/enterprise/components/admin/ui-kit/Button";
import t from "@ext/localization/locale/translate";
import { type ComponentProps, forwardRef } from "react";

type CancelButtonProps = ComponentProps<typeof Button>;

export const CancelButton = forwardRef<HTMLButtonElement, CancelButtonProps>((props, ref) => {
	return (
		<Button ref={ref} variant="outline" {...props}>
			{t("cancel")}
		</Button>
	);
});
