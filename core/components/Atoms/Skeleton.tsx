import styled from "@emotion/styled";
import { CSSProperties } from "react";

interface SkeletonProps {
	style?: CSSProperties;
	className?: string;
}

const Skeleton = (props: SkeletonProps) => {
	const { className, style } = props;

	return <div className={className} style={style} />;
};

export default styled(Skeleton)`
	border-radius: var(--radius-small);
	max-width: 100%;
	border: 0;
	display: block;
	background-color: hsl(var(--color-skeleton-bg) / 0.1);
	animation: SkeletonPulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;

	@keyframes SkeletonPulse {
		50% {
			opacity: 0.5;
		}
	}
`;
