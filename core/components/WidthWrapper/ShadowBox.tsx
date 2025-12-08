import { classNames } from "@components/libs/classNames";
import styled from "@emotion/styled";

type Direction = "left" | "right";

interface ScrollableShadowProps {
	width: number;
	height: number;
	direction: Direction;
	className?: string;
	marginLeft?: number;
}

const ScrollableShadow = ({ width, height, direction, className, marginLeft }: ScrollableShadowProps) => {
	return (
		width > 0 && (
			<div
				className={classNames("shadow-box", {}, [className, direction])}
				style={{
					width: `${Math.min(width, 40)}px`,
					height: `${height}px`,
					background: `linear-gradient(to ${direction}, transparent 0, var(--color-article-bg) 100%)`,
					[direction]: 0,
					...(marginLeft ? { marginLeft: `${marginLeft}px` } : {}),
				}}
			/>
		)
	);
};

export default styled(ScrollableShadow)`
	top: 0;
	z-index: 2;
	pointer-events: none;
	position: absolute;

	@media print {
		display: none;
	}
`;
