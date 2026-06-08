import ModalToOpenService from "@core-ui/ContextServices/ModalToOpenService/ModalToOpenService";
import ModalToOpen from "@core-ui/ContextServices/ModalToOpenService/model/ModalsToOpen";
import type { MergeResolverProps } from "@ext/git/actions/MergeConflictHandler/components/MergeResolver";

const tryOpenMergeResolver = (props: MergeResolverProps) => {
	if (!props.mergeData || props.mergeData.ok) return;
	ModalToOpenService.setValue<MergeResolverProps>(ModalToOpen.MergeResolver, props);
};

export default tryOpenMergeResolver;
