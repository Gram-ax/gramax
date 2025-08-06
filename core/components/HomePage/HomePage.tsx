import { usePlatform } from "@core-ui/hooks/usePlatform";
import { HomePageData } from "@core/SitePresenter/SitePresenter";
import styled from "@emotion/styled";
import { GlobalAudioToolbar } from "@ext/ai/components/Audio/Toolbar";
import FavoriteCatalogLinkService from "@ext/artilce/Favorite/components/FavoriteCatalogLinkService";
import BottomInfo from "./BottomInfo";
import Groups from "./Groups";
import NoneGroups from "./NoneGroups";
import TopMenu from "./TopMenu";

export default styled(({ data, className }: { data: HomePageData; className?: string }) => {
	const { isStatic, isStaticCli, isNext } = usePlatform();
	const catalogCount = data.catalogsLinks.length;

	return (
		<div className={`${className} bg-primary-bg flex flex-col`}>
			<TopMenu catalogLinks={data.catalogsLinks} />
			{catalogCount ? (
				<FavoriteCatalogLinkService.Init value={data.catalogsLinks}>
					<Groups section={data.section} breadcrumb={data.breadcrumb} />
				</FavoriteCatalogLinkService.Init>
			) : (
				<NoneGroups className="article px-4" style={{ background: "#ffffff00" }} />
			)}
			<BottomInfo />
			{!(isStatic || isStaticCli || isNext) && <GlobalAudioToolbar />}
		</div>
	);
})`
	height: 100%;
	overflow: auto;
	font-family: Roboto, sans-serif;
`;
