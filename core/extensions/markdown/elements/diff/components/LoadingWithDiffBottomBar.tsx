import SpinnerLoader from "@components/Atoms/SpinnerLoader";
import styled from "@emotion/styled";
import RenderDiffBottomBarInBody from "@ext/markdown/elements/diff/components/RenderDiffBottomBarInBody";
import { DiffFilePaths } from "@ext/VersionControl/model/Diff";

interface LoadingWithDiffBottomBarProps {
	filePath: DiffFilePaths;
}

const Wrapper = styled.div`
	display: flex;
	height: 100%;
`;

const LoadingWithDiffBottomBar = (props: LoadingWithDiffBottomBarProps) => {
	const { filePath } = props;
	return (
		<Wrapper>
			<SpinnerLoader fullScreen />
			<RenderDiffBottomBarInBody filePath={filePath} showDiffViewChanger={false} />
		</Wrapper>
	);
};

export default LoadingWithDiffBottomBar;
