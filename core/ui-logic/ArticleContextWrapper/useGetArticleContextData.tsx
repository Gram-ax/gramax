import ApiUrlCreator from "@core-ui/ApiServices/ApiUrlCreator";
import FetchService from "@core-ui/ApiServices/FetchService";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import { useRouter } from "@core/Api/useRouter";
import { ArticlePageData, ClientArticleProps, ClientCatalogProps } from "@core/SitePresenter/SitePresenter";
import { TreeReadScope } from "@ext/git/core/GitCommands/model/GitCommandsModel";
import { useEffect, useState } from "react";

type UseGetArticleContextDataProps = {
	articlePath: string;
	catalogName: string;
	scope?: TreeReadScope;
};

const useGetArticleContextData = (props: UseGetArticleContextDataProps) => {
	const { articlePath, catalogName, scope } = props;

	const apiUrlCreatorService = ApiUrlCreatorService.value;

	const [articleProps, setArticleProps] = useState<ClientArticleProps>(null);
	const [catalogProps, setCatalogProps] = useState<ClientCatalogProps>(null);
	const [apiUrlCreator, setApiUrlCreator] = useState<ApiUrlCreator>(null);
	const basePath = useRouter().basePath;

	const isLoading = !articleProps || !catalogProps || !apiUrlCreator;

	const fetchData = async () => {
		const url = apiUrlCreatorService.getPageDataByArticleData(articlePath, catalogName, scope);

		const res = await FetchService.fetch<ArticlePageData>(url);
		if (!res.ok) return;

		const data = await res.json();

		setArticleProps(data.articleProps);
		setCatalogProps(data.catalogProps);

		const apiUrlCreator = new ApiUrlCreator(basePath, data.catalogProps?.name, data.articleProps?.ref?.path);
		setApiUrlCreator(apiUrlCreator);
	};

	useEffect(() => {
		void fetchData();
	}, [articlePath, catalogName, scope]);

	return { articleProps, catalogProps, apiUrlCreator, isLoading };
};

export default useGetArticleContextData;
