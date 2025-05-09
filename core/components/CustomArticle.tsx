import UseSWRService from "@core-ui/ApiServices/UseSWRService";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import CustomArticleName from "@core/SitePresenter/customArticles/model/CustomArticle";
import Renderer from "../extensions/markdown/core/render/components/Renderer";
import getComponents from "../extensions/markdown/core/render/components/getComponents/getComponents";
import Header from "../extensions/markdown/elements/heading/render/component/Header";
import ModalLayoutLight from "./Layouts/ModalLayoutLight";

export type CustomArticleProps = {
	name: CustomArticleName;
	setLayout?: boolean;
	copyLinkIcon?: boolean;
};

const CustomArticle = ({ name, setLayout = true, copyLinkIcon = true }: CustomArticleProps) => {
	const apiUrlCreator = ApiUrlCreatorService.value;
	const { data } = UseSWRService.getData<{ title: string; content: string }>(apiUrlCreator.getCustomArticle(name));

	const article = (
		<>
			<Header level={2} copyLinkIcon={copyLinkIcon}>
				{data?.title}
			</Header>
			<div className="article" style={{ background: "none" }}>
				<div className="article-body">
					{Renderer(JSON.parse(data?.content ?? "{}"), { components: getComponents() })}
				</div>
			</div>
		</>
	);
	return setLayout ? <ModalLayoutLight>{article}</ModalLayoutLight> : article;
};

export default CustomArticle;
