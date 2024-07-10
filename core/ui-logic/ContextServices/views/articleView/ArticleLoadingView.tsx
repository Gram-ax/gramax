import SpinnerLoader from "@components/Atoms/SpinnerLoader";
import styled from "@emotion/styled";

const StyledDiv = styled.div`
	height: 100%;
	display: flex;
	align-items: center;
	justify-content: center;
`;

const ArticleLoadingView = () => (
	<StyledDiv>
		<SpinnerLoader />
	</StyledDiv>
);

export default ArticleLoadingView;
