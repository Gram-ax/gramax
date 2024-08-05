import FetchService from "@core-ui/ApiServices/FetchService";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import { useRouter } from "@core/Api/useRouter";
import { useEffect } from "react";

const useSsoHandler = (isFirstLoad: boolean) => {
	const router = useRouter();
	const { isReadOnly } = PageDataContextService.value.conf;
	const apiUrlCreator = ApiUrlCreatorService.value;

	useEffect(() => {
		if (!isFirstLoad || isReadOnly || !router.query.data) return;
		FetchService.fetch(apiUrlCreator.getAuthSsoUrl(router.query.data, router.query.sign, router.query.from));
	}, [isFirstLoad]);
};

export default useSsoHandler;
