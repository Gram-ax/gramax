import styled from "@emotion/styled";

interface SvgContainerProps {
	children: JSX.Element;
	className?: string;
	dataQa?: string;
}

const SvgContainer = styled(({ children, className, dataQa }: SvgContainerProps) => {
	return (
		<div className={className} data-qa={dataQa}>
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
