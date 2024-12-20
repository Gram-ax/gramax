import styled from "@emotion/styled";

type Direction = "left" | "right";

interface ScrollableShadowProps {
	width: number;
	height: number;
	direction: Direction;
	className?: string;
}

const ScrollableShadow = ({ width, height, direction, className }: ScrollableShadowProps) => {
	return (
		width > 0 && (
			<div
				className={`${className} ${direction}`}
				style={{
					width: `${Math.min(width, 40)}px`,
					height: `${height}px`,
					background: `linear-gradient(to ${direction}, transparent 0, var(--color-article-bg) 100%)`,
					[direction]: 0,
				}}
			/>
		)
	);
};

export default styled(ScrollableShadow)`
	top: 0;
	pointer-events: none;
	position: absolute;

	@media print {
		display: none;
	}
`;
