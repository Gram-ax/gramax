import LeftNavigationIsOpenService from "@core-ui/ContextServices/LeftNavigationIsOpen";
import { cssMedia } from "@core-ui/utils/cssUtils";
import { useMediaQuery } from "@mui/material";
import { ArticleData } from "../../../logic/SitePresenter/SitePresenter";
import ArticleComponent from "./ArticleLayout/ArticleComponent";
import CatalogLayout from "./CatalogLayout";
import LeftNavigationComponent from "./LeftNavigation/LeftNavigationComponent";
import LeftNavigationNarrowComponent from "./LeftNavigation/Narrow/LeftNavigationNarrowComponent";
import RightNavigationLayout from "./RightNavigation/RightNavigationLayout";

const CatalogComponent = ({ data, children }: { data: ArticleData; children: JSX.Element }) => {
	const narrowMedia = useMediaQuery(cssMedia.JSnarrow);
	const OPEN_DELAY_MS = 50;

	return (
		<LeftNavigationIsOpenService.Provider>
			<CatalogLayout
				catalogNav={
					narrowMedia ? (
						<LeftNavigationNarrowComponent data={data} />
					) : (
						<LeftNavigationComponent data={data} delay={OPEN_DELAY_MS} />
					)
				}
				article={
					<ArticleComponent
						article={children}
						delay={OPEN_DELAY_MS}
						rightNav={<RightNavigationLayout itemLinks={data.itemLinks} />}
					/>
				}
			/>
		</LeftNavigationIsOpenService.Provider>
	);
};

export default CatalogComponent;
