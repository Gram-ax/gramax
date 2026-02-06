import ActionConfirm from "@components/Atoms/ActionConfirm";
import ModalToOpenService from "@core-ui/ContextServices/ModalToOpenService/ModalToOpenService";
import ModalToOpen from "@core-ui/ContextServices/ModalToOpenService/model/ModalsToOpen";
import useWatch from "@core-ui/hooks/useWatch";
import t from "@ext/localization/locale/translate";
import { ComponentProps } from "react";

interface DeleteMergeRequestModalProps {
	isOpen: boolean;
	onConfirm?: () => void;
	onClose?: () => void;
}

const useOpenDeleteMergeRequestModal = (props: DeleteMergeRequestModalProps) => {
	const { isOpen, onConfirm, onClose } = props;
	useWatch(() => {
		if (!isOpen) return;
		ModalToOpenService.setValue<ComponentProps<typeof ActionConfirm>>(ModalToOpen.ActionConfirm, {
			confirmBody: t("git.merge-requests.delete-confirm.body"),
			confirmTitle: t("git.merge-requests.delete-confirm.title"),
			initialIsOpen: true,
			onConfirm,
			onClose: () => {
				onClose?.();
				ModalToOpenService.resetValue();
			},
		});
	}, [isOpen]);
};

export default useOpenDeleteMergeRequestModal;
