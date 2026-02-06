import { useRouter } from "@core/Api/useRouter";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import { ComponentProps, useEffect } from "react";
import ModalToOpenService from "../../../../../ui-logic/ContextServices/ModalToOpenService/ModalToOpenService";
import ModalToOpen from "../../../../../ui-logic/ContextServices/ModalToOpenService/model/ModalsToOpen";
import ShareTicketHandler from "../components/ShareTicketHandler";

const useShareHandler = (isFirstLoad: boolean) => {
	const router = useRouter();
	const { isReadOnly } = PageDataContextService.value.conf;

	useEffect(() => {
		if (!isFirstLoad || isReadOnly) return;
		if (!router?.query?.share) return;
		const ticket = router.query.share;
		delete router.query.share;
		router.pushQuery(router.query);
		ModalToOpenService.setValue<ComponentProps<typeof ShareTicketHandler>>(ModalToOpen.ShareTicketHandler, {
			ticket,
		});
	}, [isFirstLoad]);
};

export default useShareHandler;
