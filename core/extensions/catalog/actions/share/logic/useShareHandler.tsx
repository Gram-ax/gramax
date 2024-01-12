import { ComponentProps, useEffect } from "react";
import { Router } from "../../../../../logic/Api/Router";
import ModalToOpenService from "../../../../../ui-logic/ContextServices/ModalToOpenService/ModalToOpenService";
import ModalToOpen from "../../../../../ui-logic/ContextServices/ModalToOpenService/model/ModalsToOpen";
import ShareTicketHandler from "../components/ShareTicketHandler";

const useShareHandler = (router: Router) => {
	useEffect(() => {
		if (!router?.query?.share) return;
		const ticket = router.query.share;
		delete router.query.share;
		router.pushQuery(router.query);
		ModalToOpenService.setValue<ComponentProps<typeof ShareTicketHandler>>(ModalToOpen.ShareTicketHandler, {
			ticket,
		});
	}, []);
};

export default useShareHandler;
