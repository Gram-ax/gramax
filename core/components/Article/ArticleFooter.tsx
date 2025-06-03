import MarkAsRead from "@components/Article/Footer/MarkAsRead";
import { usePlatform } from "@core-ui/hooks/usePlatform";
import styled from "@emotion/styled";
import { ItemLink } from "@ext/navigation/NavigationLinks";
import NextPrevious from "@ext/navigation/NextPrevious";
import { ContentEditorId } from "@ext/markdown/core/edit/components/ContentEditor";
import ArticleExtensions from "@components/Article/ArticleExtensions";
import ApiUrlCreator from "@core-ui/ContextServices/ApiUrlCreator";

interface ArticleFooterProps {
	logicPath: string;
	itemLinks: ItemLink[];
}

const Wrapper = styled.div`
	display: flex;
	align-items: center;
	justify-content: center;
`;

const ArticleFooter = ({ logicPath, itemLinks }: ArticleFooterProps) => {
	const apiUrlCreator = ApiUrlCreator.value;
	const { isNext } = usePlatform();

	return (
		<>
			{isNext && logicPath && (
				<Wrapper>
					<MarkAsRead logicPath={logicPath} apiUrlCreator={apiUrlCreator} />
				</Wrapper>
			)}
			<NextPrevious itemLinks={itemLinks} />
			<ArticleExtensions id={ContentEditorId} />
		</>
	);
};

export default ArticleFooter;
