import { forwardRef } from "react";
import styled from "@emotion/styled";

type PreviewContainerProps = React.HTMLAttributes<HTMLDivElement>;

const PreviewContainerUnstyled = forwardRef<HTMLDivElement, PreviewContainerProps>((props, ref) => {
	return <div ref={ref} {...props} />;
});

export const PreviewContainer = styled(PreviewContainerUnstyled)`
	width: 100%;
	height: 100%;
`;
