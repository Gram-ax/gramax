import { useRouter } from "@core/Api/useRouter";
import { ClientCatalogProps } from "@core/SitePresenter/SitePresenter";
import ApiUrlCreator from "@core-ui/ApiServices/ApiUrlCreator";
import FetchService from "@core-ui/ApiServices/FetchService";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import { TreeReadScope } from "@ext/git/core/GitCommands/model/GitCommandsModel";
import { useEffect, useState } from "react";

type UseGetCatalogContextDataProps = {
	catalogName: string;
	scope?: TreeReadScope;
};

const useGetCatalogContextData = (props: UseGetCatalogContextDataProps) => {
	const { catalogName, scope } = props;

	const apiUrlCreatorService = ApiUrlCreatorService.value;

	const [catalogProps, setCatalogProps] = useState<ClientCatalogProps>(null);
	const [apiUrlCreator, setApiUrlCreator] = useState<ApiUrlCreator>(null);
	const basePath = useRouter().basePath;

	const isLoading = !catalogProps || !apiUrlCreator;

	const fetchData = async () => {
		const url = apiUrlCreatorService.getScopedPageDataByCatalog(catalogName, scope);

		const res = await FetchService.fetch<ClientCatalogProps>(url);
		if (!res.ok) return;

		const catalogProps = await res.json();

		setCatalogProps(catalogProps);

		const apiUrlCreator = new ApiUrlCreator(basePath, catalogProps?.name);
		setApiUrlCreator(apiUrlCreator);
	};

	useEffect(() => {
		if (!catalogName) return;
		void fetchData();
	}, [catalogName, scope]);

	return { catalogProps, apiUrlCreator, isLoading };
};

export default useGetCatalogContextData;
