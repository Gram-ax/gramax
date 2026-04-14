import styled from "@emotion/styled";
import { forwardRef } from "react";

type PreviewContainerProps = React.HTMLAttributes<HTMLDivElement>;

const PreviewContainerUnstyled = forwardRef<HTMLDivElement, PreviewContainerProps>((props, ref) => {
	return <div ref={ref} {...props} />;
});

export const PreviewContainer = styled(PreviewContainerUnstyled)`
	width: 100%;
	height: 100%;
	display: grid;
	align-content: center;

	&[data-loaded="false"] > div:last-of-type {
		opacity: 0;
		pointer-events: none;
	}
`;
