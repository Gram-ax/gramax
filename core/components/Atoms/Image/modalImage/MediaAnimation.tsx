import styled from "@emotion/styled";
import { ReactNode } from "react";

interface MediaAnimationProps {
	isClosing: boolean;
	children: ReactNode;
	className?: string;
}

const Container = styled.div`
	position: absolute;
	left: 50%;
	top: 50%;
	transform: translate(-50%, -50%);
	z-index: var(--z-index-article-modal);
	user-select: none;
`;

export const MediaAnimation = (props: MediaAnimationProps) => {
	const { isClosing, className, children } = props;

	const AnimatedDiv = styled.div`
		animation: ${() => (!isClosing ? "open" : "close")} 200ms forwards;
		position: relative;
		width: fit-content;
		height: fit-content;
		display: flex;
		justify-content: center;
		align-items: center;

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
