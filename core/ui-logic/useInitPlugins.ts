import FetchService from "@core-ui/ApiServices/FetchService";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import { useEffect } from "react";

const useInitPlugins = (isFirstLoad: boolean) => {
	const apiUrlCreator = ApiUrlCreatorService.value;
	const initPlugins = async () => {
		let res = await FetchService.fetch(apiUrlCreator.pluginsAddLocals());
		if (!res.ok) return;
		res = await FetchService.fetch(apiUrlCreator.pluginsInit());
		if (!res.ok) return;
	};

	useEffect(() => {
		if (!isFirstLoad) return;
		void initPlugins();
	}, [isFirstLoad]);
};

export default useInitPlugins;
