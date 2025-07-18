import { classNames } from "@components/libs/classNames";
import styled from "@emotion/styled";
import { CSSProperties, ElementType, ReactNode } from "react";

interface SkeletonProps {
	width: string;
	elementType?: ElementType;
	height?: string;
	isLoaded: boolean;
	children: ReactNode;
	style?: CSSProperties;
	className?: string;
}

const ImageSkeleton = ({ className, style, children, isLoaded, elementType: Tag = "div" }: SkeletonProps) => {
	return (
		<Tag className={classNames(className, { skeleton: !isLoaded })} style={style}>
			{children}
		</Tag>
	);
};

export default styled(ImageSkeleton)`
	&.skeleton {
		border-radius: var(--radius-small);
		max-width: 100%;
		border: 0;
		display: block;
		${(p) => p.width && `width: ${p.width};`}
		${(p) => p.height && `height: ${p.height};`}
		background-color: hsl(var(--color-skeleton-bg) / .1);
		animation: SkeletonPulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;

		> * {
			display: none;
		}

		*[data-focusable="true"] {
			outline: none !important;
			outline-offset: unset;
		}

		:has(> .diagram-background),
		:has(> .drawio) {
			width: 100%;
			margin: 0.5em 0;
		}
	}

	@keyframes SkeletonPulse {
		50% {
			opacity: 0.5;
		}
	}
`;
