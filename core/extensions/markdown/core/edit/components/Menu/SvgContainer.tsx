import styled from "@emotion/styled";

const SvgContainer = styled(({ children, className }: { children: JSX.Element; className?: string }) => {
	return (
		<div className={className}>
			{children}
		</div>
	);
})`
	display: flex;
	justify-content: center;
	align-items: center;
	padding: 5px;

	svg: {
		display: block;
	}
`;

export default SvgContainer;
