import ModalErrorHandler from "@ext/errorHandlers/client/components/ModalErrorHandler";
import { DialogContent, Dialog as UiKitDialog } from "ics-ui-kit/components/dialog";
import { type ComponentProps, useState } from "react";

export const Dialog = (props: ComponentProps<typeof UiKitDialog>) => {
	const [isCloseOnError, setIsCloseOnError] = useState(false);

	const closeModal = () => {
		setIsCloseOnError(true);
	};
	return (
		<UiKitDialog {...props} open={!isCloseOnError && props.open}>
			<ModalErrorHandler onClose={closeModal} wrapper={DialogContent}>
				{props.children}
			</ModalErrorHandler>
		</UiKitDialog>
	);
};
