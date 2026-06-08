import { useRouter } from "@core/Api/useRouter";
import ModalToOpenService from "@core-ui/ContextServices/ModalToOpenService/ModalToOpenService";
import ModalToOpen from "@core-ui/ContextServices/ModalToOpenService/model/ModalsToOpen";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import { useEffect } from "react";

const useInviteMismatchHandler = (isFirstLoad: boolean) => {
	const router = useRouter();
	const { isReadOnly } = PageDataContextService.value.conf;
	const { url: gesCloudUrl } = PageDataContextService.value.conf.enterpriseCloud;

	// biome-ignore lint/correctness/useExhaustiveDependencies: should be called only once
	useEffect(() => {
		const inviteMismatch = router.query.inviteMismatch;

		if (isFirstLoad && !isReadOnly && gesCloudUrl && inviteMismatch === "true") {
			const modalId = ModalToOpenService.addModal(ModalToOpen.GesCloudInviteMismatch, {
				onClose: () => {
					ModalToOpenService.removeModal(modalId);
				},
			});
		}
	}, [isFirstLoad]);
};

export default useInviteMismatchHandler;
