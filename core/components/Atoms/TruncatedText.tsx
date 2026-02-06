import Tooltip from "@components/Atoms/Tooltip";
import styled from "@emotion/styled";
import { type HTMLAttributes, useEffect, useRef, useState } from "react";

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
		<Tooltip content={isOverflowing ? children : null} hideInMobile hideOnClick placement="left">
			<TruncatedDiv {...props} maxWidth={maxWidth} ref={ref}>
				{children}
			</TruncatedDiv>
		</Tooltip>
	);
};

export default TruncatedText;
