import Tooltip from "@components/Atoms/Tooltip";
import styled from "@emotion/styled";
import { useEffect, useRef, useState, type HTMLAttributes } from "react";

const TruncatedDiv = styled.div<{ maxWidth: number }>`
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
	display: block;
	max-width: ${({ maxWidth }) => maxWidth}px;
`;

export type TruncatedDivProps = HTMLAttributes<HTMLDivElement> & {
	maxWidth?: number;
};

const TruncatedText = ({ children, maxWidth = 180, ...props }: TruncatedDivProps) => {
	const ref = useRef<HTMLDivElement>(null);
	const [isOverflowing, setIsOverflowing] = useState(false);

	useEffect(() => setIsOverflowing(ref.current.clientWidth >= maxWidth - 1), [children, maxWidth]);

	return (
		<Tooltip hideInMobile hideOnClick placement="left" content={isOverflowing ? children : null}>
			<TruncatedDiv {...props} ref={ref} maxWidth={maxWidth}>
				{children}
			</TruncatedDiv>
		</Tooltip>
	);
};

export default TruncatedText;
