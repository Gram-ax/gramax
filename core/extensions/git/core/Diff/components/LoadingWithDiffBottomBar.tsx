import SpinnerLoader from "@components/Atoms/SpinnerLoader";
import styled from "@emotion/styled";

const Wrapper = styled.div`
	display: flex;
	height: 100%;
`;

const LoadingWithDiffBottomBar = () => {
	return (
		<Wrapper>
			<SpinnerLoader fullScreen />
		</Wrapper>
	);
};

export default LoadingWithDiffBottomBar;
