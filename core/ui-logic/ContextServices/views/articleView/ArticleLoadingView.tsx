import SpinnerLoader from "@components/Atoms/SpinnerLoader";
import styled from "@emotion/styled";
import { cssMedia } from "@core-ui/utils/cssUtils";

const StyledDiv = styled.div`
	height: 100%;
	display: flex;
	align-items: center;
	justify-content: center;

	${cssMedia.narrow} {
		height: fit-content;
		min-height: 100dvh;
	}
`;

const ArticleLoadingView = () => (
	<StyledDiv>
		<SpinnerLoader />
	</StyledDiv>
);

export default ArticleLoadingView;
