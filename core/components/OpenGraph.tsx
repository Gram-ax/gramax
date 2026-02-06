import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import { useRouter } from "../logic/Api/useRouter";
import { OpenGraphData } from "../logic/SitePresenter/SitePresenter";

const OpenGraphProperty = ({ property, content }: { property: string; content: string }) => {
	return <meta content={content} property={`og:${property}`} />;
};

const OpenGraph = ({ openGraphData }: { openGraphData: OpenGraphData }) => {
	const domain = PageDataContextService.value.domain;
	const router = useRouter();
	const apiUrlCreator = ApiUrlCreatorService.value;
	return (
		<>
			<OpenGraphProperty content={openGraphData?.title ?? ""} property="title" />
			<OpenGraphProperty content="article" property="type" />
			<OpenGraphProperty content={apiUrlCreator.getOpenGraphLogoUrl(domain)} property="image" />
			<OpenGraphProperty content="64" property="image:width" />
			<OpenGraphProperty content="64" property="image:height" />
			<OpenGraphProperty content={openGraphData?.description ?? ""} property="description" />
			<OpenGraphProperty content={domain + router?.path} property="url" />
		</>
	);
};

export default OpenGraph;
