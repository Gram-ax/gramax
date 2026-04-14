import ModalToOpenService from "@core-ui/ContextServices/ModalToOpenService/ModalToOpenService";
import ModalToOpen from "@core-ui/ContextServices/ModalToOpenService/model/ModalsToOpen";
import type CloudModal from "@ext/static/components/CloudModal";
import type { ComponentProps } from "react";

const openCloudModal = () => {
	ModalToOpenService.setValue<ComponentProps<typeof CloudModal>>(ModalToOpen.CloudModal, {
		onClose: () => {
			ModalToOpenService.resetValue();
		},
	});
};

export default openCloudModal;
