import { AlertDialogContent as UiKitAlertDialogContent } from "ics-ui-kit/components/alert-dialog";
import type { FC } from "react";
import type { ExtractComponentGeneric } from "../../lib/extractComponentGeneric";

type UiKitAlertDialogContentProps = ExtractComponentGeneric<typeof UiKitAlertDialogContent>;

export const AlertDialogContent: FC<UiKitAlertDialogContentProps> = (props) => {
	const { className, ...otherProps } = props;

	return <UiKitAlertDialogContent {...otherProps} data-qa="modal-content" data-testid="modal" />;
};
