import { ComponentProps, useEffect } from "react";
import { Router } from "../../../../../logic/Api/Router";
import ModalToOpenService from "../../../../../ui-logic/ContextServices/ModalToOpenService/ModalToOpenService";
import ModalToOpen from "../../../../../ui-logic/ContextServices/ModalToOpenService/model/ModalsToOpen";
import ReviewTicketHandler from "../components/ReviewTicketHandler";

const useReviewHandler = (router: Router) => {
	useEffect(() => {
		if (!router?.query?.review) return;
		const ticket = router.query.review;
		delete router.query.review;
		router.pushQuery(router.query);
		ModalToOpenService.setValue<ComponentProps<typeof ReviewTicketHandler>>(ModalToOpen.ReviewTicketHandler, {
			ticket,
		});
	}, []);
};

export default useReviewHandler;
