import type { OpenGraphData } from "../../logic/SitePresenter/SitePresenter";
import logo from "./logo.png";

const OpenGraphProperty = ({ property, content }: { property: string; content: string }) => {
	return <meta content={content} property={`og:${property}`} />;
};

const OpenGraph = ({ openGraphData, domain }: { openGraphData: OpenGraphData; domain: string }) => {
	return (
		<>
			<OpenGraphProperty content={openGraphData?.title ?? ""} property="title" />
			<OpenGraphProperty content="article" property="type" />
			<OpenGraphProperty content={(logo as NextImage).src} property="image" />
			<OpenGraphProperty content="64" property="image:width" />
			<OpenGraphProperty content="64" property="image:height" />
			<OpenGraphProperty content={openGraphData?.description ?? ""} property="description" />
			{openGraphData?.pathname && (
				<OpenGraphProperty content={domain + (openGraphData?.pathname ?? "")} property="url" />
			)}
		</>
	);
};

export default OpenGraph;
