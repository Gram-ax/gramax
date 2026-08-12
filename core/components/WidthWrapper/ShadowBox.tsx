import { cn } from "@core-ui/utils/cn";

type Direction = "left" | "right";

interface ScrollableShadowProps {
	width?: number;
	height?: number;
	direction?: Direction;
	marginLeft?: number;
	force?: boolean;
}

const ScrollableShadow = ({ width, height, direction, marginLeft, force }: ScrollableShadowProps) => {
	return (
		(width > 0 || force) && (
			<div
				className={cn("shadow-box", direction, "top-0 z-[2] pointer-events-none absolute print:hidden")}
				data-width={width}
				style={{
					width: `${Math.min(width, 40)}px`,
					height: `${height}px`,
					background: `linear-gradient(to ${direction}, rgba(var(--color-article-bg-rgb),0) 0%, rgba(var(--color-article-bg-rgb),0.040) 13.5%, rgba(var(--color-article-bg-rgb),0.108) 24.6%, rgba(var(--color-article-bg-rgb),0.212) 36.6%, rgba(var(--color-article-bg-rgb),0.329) 46.7%, rgba(var(--color-article-bg-rgb),0.464) 56.9%, rgba(var(--color-article-bg-rgb),0.585) 65.7%, rgba(var(--color-article-bg-rgb),0.698) 75%, rgba(var(--color-article-bg-rgb),0.774) 82.7%, rgba(var(--color-article-bg-rgb),0.833) 89.7%, rgba(var(--color-article-bg-rgb),0.869) 95.7%, rgba(var(--color-article-bg-rgb),0.900) 100% )`,
					[direction]: 0,
					...(marginLeft ? { marginLeft: `${marginLeft}px` } : {}),
				}}
			/>
		)
	);
};

export default ScrollableShadow;
