import TabWrapper from "@components/Layouts/LeftNavigationTabs/TabWrapper";
import t from "@ext/localization/locale/translate";
import { useCallback, useEffect, useRef, useState } from "react";
import ItemList from "@ext/articleProvider/components/ItemList";
import { useRouter } from "@core/Api/useRouter";
import FavoriteService from "@ext/artilce/Favorite/components/FavoriteService";
import Workspace from "@core-ui/ContextServices/Workspace";
import CatalogPropsService from "@core-ui/ContextServices/CatalogProps";
import ApiUrlCreator from "@core-ui/ContextServices/ApiUrlCreator";
import FetchService from "@core-ui/ApiServices/FetchService";
import SpinnerLoader from "@components/Atoms/SpinnerLoader";
import { FavoriteArticleData } from "@ext/artilce/Favorite/models/types";

const FavoriteArticlesTab = ({ show }: { show: boolean }) => {
	const tabWrapperRef = useRef<HTMLDivElement>(null);
	const { articles } = FavoriteService.value;
	const catalogProps = CatalogPropsService.value;
	const apiUrlCreator = ApiUrlCreator.value;

	const workspace = Workspace.current();
	const [height, setHeight] = useState(0);
	const [isLoading, setIsLoading] = useState(false);
	const [items, setItems] = useState<FavoriteArticleData[]>([]);

	const router = useRouter();

	const fetchArticleData = useCallback(
		async (paths: string[]) => {
			setIsLoading(true);
			const url = apiUrlCreator.getFavoriteArticleData();
			const res = await FetchService.fetch(url, JSON.stringify(paths));
			if (!res.ok) {
				setIsLoading(false);
				return;
			}

			const data = (await res.json()) || [];
			setItems(data);
			setIsLoading(false);
		},
		[apiUrlCreator, articles],
	);

	useEffect(() => {
		if (!show) return;

		fetchArticleData(articles);
	}, [show, catalogProps.name, workspace.name, articles]);

	const onItemClick = useCallback(
		(id: string) => {
			const item = items?.[id];
			if (!item) return;
			router.pushPath(item.pathname);
		},
		[router, items],
	);

	return (
		<TabWrapper ref={tabWrapperRef} isTop show={show} title={t("favorites-articles")} contentHeight={height}>
			{isLoading ? (
				<SpinnerLoader fullScreen />
			) : (
				<ItemList
					show={show}
					items={items}
					tabWrapperRef={tabWrapperRef}
					setContentHeight={setHeight}
					selectedItemId={null}
					onItemClick={onItemClick}
					noItemsText={t("no-favorites-in-catalog")}
				/>
			)}
		</TabWrapper>
	);
};

export default FavoriteArticlesTab;
