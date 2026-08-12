import RightNavigationComponent from "@components/Layouts/CatalogLayout/RightNavigation/RightNavigationComponent";
import type { ArticlePageData } from "@core/SitePresenter/types/ArticlePage";
import SidebarsIsOpenService from "@core-ui/ContextServices/Sidebars/SidebarsIsOpenContext";
import useArticleScrollPosition from "@core-ui/hooks/useArticleScrollPosition";
import useMediaQuery from "@core-ui/hooks/useMediaQuery";
import { cssMedia } from "@core-ui/utils/cssUtils";
import ArticleComponent from "./ArticleLayout/ArticleComponent";
import CatalogLayout from "./CatalogLayout";
import LeftNavigationComponent from "./LeftNavigation/LeftNavigationComponent";
import LeftNavigationNarrowComponent from "./LeftNavigation/Narrow/LeftNavigationNarrowComponent";

const OPEN_DELAY_MS = 50;

const CatalogComponent = ({ data, children }: { data: ArticlePageData; children: JSX.Element }) => {
	const narrowMedia = useMediaQuery(cssMedia.JSnarrow);
	const mediumMedia = useMediaQuery(cssMedia.JSmedium);

	useArticleScrollPosition(data);

	return (
		<SidebarsIsOpenService.Provider>
			<>
				<CatalogLayout
					article={
						<ArticleComponent
							article={children}
							rightNav={<RightNavigationComponent delay={OPEN_DELAY_MS} />}
						/>
					}
					catalogNav={
						narrowMedia ? (
							<LeftNavigationNarrowComponent data={data} />
						) : (
							<LeftNavigationComponent data={data} delay={OPEN_DELAY_MS} mediumMedia={mediumMedia} />
						)
					}
				/>
			</>
		</SidebarsIsOpenService.Provider>
	);
};

export default CatalogComponent;
