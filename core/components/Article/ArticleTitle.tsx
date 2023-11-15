import ArticlePropsService from "@core-ui/ContextServices/ArticleProps";
import IsEditService from "@core-ui/ContextServices/IsEdit";
import HeaderEditor from "../../extensions/artilce/actions/HeaderEditor";
import Header from "../../extensions/markdown/elements/heading/render/component/Header";

const ArticleTitle = () => {
	const isEdit = IsEditService.value;
	const articleProps = ArticlePropsService.value;

	return (
		<>
			{isEdit ? (
				<HeaderEditor />
			) : (
				<Header level={1} className={"article-title"} dataQa={"article-title"}>
					{articleProps.title}
				</Header>
			)}
			{!articleProps.description ? null : (
				<Header level={2} className={"article-description"} dataQa={"article-description"}>
					{articleProps.description}
				</Header>
			)}
		</>
	);
};

export default ArticleTitle;
