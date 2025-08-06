import { css } from "@emotion/react";
import styled from "@emotion/styled";

export const Wrapper = styled.div`
	height: 100%;
	width: 100%;
	display: flex;
	justify-content: end;
	flex-direction: column;
	overflow: hidden;
	position: absolute;
	border-radius: var(--radius-large);
`;

export const Bar = styled.div<{ progress?: number }>`
	z-index: var(--z-index-base);
	height: 2px;
	width: ${(p) => (p.progress > 0 ? p.progress : 50)}%;
	background-color: var(--color-primary);
	border-radius: var(--radius-large);
	transition: width 0.3s ease-in-out;

	@keyframes loading {
		0% {
			transform: translateX(-100%);
		}
		100% {
			transform: translateX(200%);
		}
	}

	${(p) =>
		!p.progress &&
		css`
			animation: loading 2.1s cubic-bezier(0.4, 0, 0.2, 1) infinite;
		`}
`;
