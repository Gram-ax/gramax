import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import { usePlatform } from "@core-ui/hooks/usePlatform";
import checkConflict from "@ext/git/actions/MergeConflictHandler/error/logic/checkConflict";
import { useRef } from "react";
import { useCatalogPropsStore } from "@core-ui/stores/CatalogPropsStore/CatalogPropsStore.provider";

const visitedCatalogs: string[] = [];

const useOnCatalogFirstClick = () => {
	const pageData = PageDataContextService.value;
	const apiUrlCreator = ApiUrlCreatorService.value;
	const { isArticle } = pageData;
	const { isReadOnly } = pageData.conf;
	const prevIsArticle = useRef<boolean>();
	const catalogName = useCatalogPropsStore((state) => state.data?.name);
	const { isNext } = usePlatform();

	if (prevIsArticle.current !== isArticle) {
		const fromHomePageClick = prevIsArticle.current === false && isArticle === true;
		prevIsArticle.current = isArticle;
		if (!fromHomePageClick) return;

		if (visitedCatalogs.includes(catalogName)) return;
		visitedCatalogs.push(catalogName);

		const callbacks = async () => {
			await checkConflict({ apiUrlCreator, isNext, isReadOnly });
		};
		void callbacks();
	}
};

export default useOnCatalogFirstClick;
