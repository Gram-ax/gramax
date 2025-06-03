import SpinnerLoader from "@components/Atoms/SpinnerLoader";
import styled from "@emotion/styled";

const StyledDiv = styled.div`
	display: flex;
	position: absolute;
	top: 50%;
	left: 50%;
	transform: translate(-50%, -50%);
	align-items: center;
	justify-content: center;
	gap: 0.5em;
	font-size: 0.875rem;
`;

const LoaderText = ({ text }: { text: string }) => {
	return (
		<StyledDiv>
			<SpinnerLoader width={14} height={14} />
			<span>{text}</span>
		</StyledDiv>
	);
};

export default LoaderText;
