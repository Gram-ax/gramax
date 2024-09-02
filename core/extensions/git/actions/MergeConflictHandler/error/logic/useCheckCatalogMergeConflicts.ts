import FetchService from "@core-ui/ApiServices/FetchService";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import CatalogPropsService from "@core-ui/ContextServices/CatalogProps";
import ModalToOpenService from "@core-ui/ContextServices/ModalToOpenService/ModalToOpenService";
import ModalToOpen from "@core-ui/ContextServices/ModalToOpenService/model/ModalsToOpen";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import { usePlatform } from "@core-ui/hooks/usePlatform";
import MergeConflictConfirm from "@ext/git/actions/MergeConflictHandler/components/MergeConflictConfirm";
import MergeData from "@ext/git/actions/MergeConflictHandler/model/MergeData";
import t from "@ext/localization/locale/translate";
import { ComponentProps, useRef } from "react";

const visitedCatalogs: string[] = [];

const useCheckCatalogMergeConflicts = () => {
	const pageData = PageDataContextService.value;
	const apiUrlCreator = ApiUrlCreatorService.value;
	const { isArticle } = pageData;
	const { isReadOnly } = pageData.conf;
	const prevIsArticle = useRef<boolean>();
	const catalogName = CatalogPropsService.value?.name;
	const { isNext } = usePlatform();

	if (isNext || isReadOnly) return;

	if (prevIsArticle.current !== isArticle) {
		const fromHomePageClick = prevIsArticle.current === false && isArticle === true;
		prevIsArticle.current = isArticle;
		if (!fromHomePageClick) return;

		if (visitedCatalogs.includes(catalogName)) return;
		visitedCatalogs.push(catalogName);

		const checkConflict = async () => {
			const res = await FetchService.fetch<MergeData>(apiUrlCreator.getMergeData());
			if (!res.ok) return;
			const mergeData = await res.json();
			if (mergeData.ok) return;
			ModalToOpenService.setValue<ComponentProps<typeof MergeConflictConfirm>>(ModalToOpen.MergeConfirm, {
				mergeData,
				errorText: t("git.merge.confirm.catalog-conflict-state"),
				title: t("git.merge.error.catalog-conflict-state"),
			});
		};
		void checkConflict();
	}
};

export default useCheckCatalogMergeConflicts;
