import ModalToOpenService from "@core-ui/ContextServices/ModalToOpenService/ModalToOpenService";
import ModalToOpen from "@core-ui/ContextServices/ModalToOpenService/model/ModalsToOpen";

export const confirmCommentClose = async () => {
	const result = await new Promise<boolean>((resolve) => {
		if (ModalToOpenService.hasValue()) {
			resolve(false);
			return;
		}

		ModalToOpenService.setValue(ModalToOpen.UnsavedCommentModal, {
			onConfirm: () => {
				resolve(true);
				ModalToOpenService.resetValue();
			},
			onCancel: () => {
				resolve(false);
				ModalToOpenService.resetValue();
			},
		});
	});

	return result;
};
