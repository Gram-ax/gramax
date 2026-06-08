import ModalToOpenService from "@core-ui/ContextServices/ModalToOpenService/ModalToOpenService";
import ModalToOpen from "@core-ui/ContextServices/ModalToOpenService/model/ModalsToOpen";
import type { MergeConflictConfirmProps } from "@ext/git/actions/MergeConflictHandler/components/MergeConflictConfirm";

const tryOpenMergeConflict = (props: MergeConflictConfirmProps) => {
	if (!props.mergeData || props.mergeData.ok) return;
	ModalToOpenService.setValue<MergeConflictConfirmProps>(ModalToOpen.MergeConfirm, props);
};

export default tryOpenMergeConflict;
