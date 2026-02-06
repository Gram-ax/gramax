import { useRouter } from "@core/Api/useRouter";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import { ComponentProps, useEffect } from "react";
import ModalToOpenService from "../../../../../ui-logic/ContextServices/ModalToOpenService/ModalToOpenService";
import ModalToOpen from "../../../../../ui-logic/ContextServices/ModalToOpenService/model/ModalsToOpen";
import ReviewTicketHandler from "../components/ReviewTicketHandler";

const useReviewHandler = (isFirstLoad: boolean) => {
	const router = useRouter();
	const { isReadOnly } = PageDataContextService.value.conf;

	useEffect(() => {
		if (!isFirstLoad || isReadOnly) return;
		if (!router?.query?.review) return;
		const ticket = router.query.review;
		delete router.query.review;
		router.pushQuery(router.query);
		ModalToOpenService.setValue<ComponentProps<typeof ReviewTicketHandler>>(ModalToOpen.ReviewTicketHandler, {
			ticket,
		});
	}, [isFirstLoad]);
};

export default useReviewHandler;
