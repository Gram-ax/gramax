import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import { useRouter } from "../logic/Api/useRouter";
import { OpenGraphData } from "../logic/SitePresenter/SitePresenter";

const OpenGraphProperty = ({ property, content }: { property: string; content: string }) => {
	return <meta property={`og:${property}`} content={content} />;
};

const OpenGraph = ({ openGraphData }: { openGraphData: OpenGraphData }) => {
	const domain = PageDataContextService.value.domain;
	const router = useRouter();
	const apiUrlCreator = ApiUrlCreatorService.value;
	return (
		<>
			<OpenGraphProperty property="title" content={openGraphData?.title ?? ""} />
			<OpenGraphProperty property="type" content="article" />
			<OpenGraphProperty property="image" content={apiUrlCreator.getOpenGraphLogoUrl(domain)} />
			<OpenGraphProperty property="image:width" content="64" />
			<OpenGraphProperty property="image:height" content="64" />
			<OpenGraphProperty property="description" content={openGraphData?.description ?? ""} />
			<OpenGraphProperty property="url" content={domain + router?.path} />
		</>
	);
};

export default OpenGraph;
