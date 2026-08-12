import { Button } from "@ext/enterprise/components/admin/ui-kit/Button";
import t from "@ext/localization/locale/translate";
import { LoadingButtonTemplate } from "@ui-kit/Button";
import { type ComponentProps, forwardRef } from "react";

type SaveButtonProps = ComponentProps<typeof Button> & {
	isSaving?: boolean;
};

export const SaveButton = forwardRef<HTMLButtonElement, SaveButtonProps>(({ isSaving, ...rest }, ref) => {
	if (isSaving) return <LoadingButtonTemplate ref={ref} text={t("enterprise.admin.saving")} />;

	return (
		<Button ref={ref} {...rest}>
			{t("save")}
		</Button>
	);
});
