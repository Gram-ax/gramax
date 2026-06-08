import type { HomePageData } from "@core/SitePresenter/SitePresenter";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import GesEditorHomePage from "@ext/enterprise/components/HomePage/GesEditorHomePage";
import { GesCloudEditorHomePage } from "@ext/enterprise-cloud/components/HomePage/GesCloudEditorHomePage";
import BrowserOpenSourceHomePage from "./BrowserOpenSourceHomePage";

const BrowserHomePage = ({ data }: { data: HomePageData }) => {
	const gesUrl = PageDataContextService.value.conf.activeGesUrl;
	const { url: gesCloudUrl } = PageDataContextService.value.conf.enterpriseCloud;

	if (gesCloudUrl) return <GesCloudEditorHomePage data={data} />;
	if (gesUrl) return <GesEditorHomePage data={data} />;
	return <BrowserOpenSourceHomePage data={data} />;
};

export default BrowserHomePage;
