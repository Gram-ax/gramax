import styled from "@emotion/styled";
import { Loader } from "@ui-kit/Loader";

const FileLoaderContainer = styled.div`
	position: absolute;
	top: 50%;
	left: 50%;
	transform: translate(-50%, -50%);
`;

export const FileLoader = () => {
	return (
		<FileLoaderContainer data-loader="true">
			<Loader size="3xl" />
		</FileLoaderContainer>
	);
};
