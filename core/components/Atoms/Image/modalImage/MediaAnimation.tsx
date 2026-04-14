import styled from "@emotion/styled";
import type { ReactNode } from "react";

interface MediaAnimationProps {
	isClosing: boolean;
	children: ReactNode;
	className?: string;
}

const Container = styled.div`
	position: absolute;
	left: 0;
	top: 0;
	z-index: var(--z-index-ui-kit-modal);
	user-select: none;
	height: 100dvh;
	width: 100dvw;
`;

export const MediaAnimation = (props: MediaAnimationProps) => {
	const { isClosing, className, children } = props;

	const AnimatedDiv = styled.div`
		animation: ${() => (!isClosing ? "open" : "close")} 200ms forwards;
		position: relative;
		height: 100%;
		width: 100%;

		@keyframes open {
			from {
				opacity: 0;
			}
			to {
				opacity: 1;
			}
		}

		@keyframes close {
			from {
				opacity: 1;
			}
			to {
				opacity: 0;
			}
		}
	`;

	return (
		<Container className={className}>
			<AnimatedDiv data-close="true">{children}</AnimatedDiv>
		</Container>
	);
};
