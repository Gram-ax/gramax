import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import NextHead from "../../apps/next/components/Atoms/Head";
import { useRouter } from "../logic/Api/useRouter";
import { OpenGraphData } from "../logic/SitePresenter/SitePresenter";

const OpenGraph = ({ openGraphData }: { openGraphData: OpenGraphData }) => {
	const domain = PageDataContextService.value.domain;
	const router = useRouter();
	const apiUrlCreator = ApiUrlCreatorService.value;
	return (
		<NextHead>
			{createOGproperty("title", openGraphData?.title ?? "")}
			{createOGproperty("type", "article")}
			{createOGproperty("image", apiUrlCreator.getOpenGraphLogoUrl(domain))}
			{createOGproperty("image:width", "64")}
			{createOGproperty("image:height", "64")}
			{createOGproperty("description", openGraphData?.description ?? "")}
			{createOGproperty("url", domain + router?.path)}
		</NextHead>
	);
};

export default OpenGraph;

function createOGproperty(property: string, content: string) {
	return <meta property={`og:${property}`} content={content} />;
}
