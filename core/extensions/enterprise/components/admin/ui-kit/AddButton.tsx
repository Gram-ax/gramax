import { Button, type ButtonProps } from "@ext/enterprise/components/admin/ui-kit/Button";
import t from "@ext/localization/locale/translate";
import { forwardRef } from "react";

type AddButtonProps = ButtonProps & {
	title?: string;
};

export const AddButton = forwardRef<HTMLButtonElement, AddButtonProps>((props, ref) => {
	return (
		<Button className="pl-2.5" ref={ref} startIcon="plus" variant="outline" {...props}>
			{props.title ?? t("add")}
		</Button>
	);
});
