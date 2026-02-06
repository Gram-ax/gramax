import { VIEWBOX_CENTER_X, VIEWBOX_CENTER_Y } from "./constants";

function Path({
	className,
	counterClockwise,
	dashRatio,
	pathRadius,
	strokeWidth,
	style,
}: {
	className?: string;
	counterClockwise: boolean;
	dashRatio: number;
	pathRadius: number;
	strokeWidth: number;
	style?: object;
}) {
	return (
		<path
			className={className}
			d={getPathDescription({
				pathRadius,
				counterClockwise,
			})}
			fillOpacity={0}
			strokeWidth={strokeWidth}
			style={Object.assign({}, style, getDashStyle({ pathRadius, dashRatio, counterClockwise }))}
		/>
	);
}

function getPathDescription({ pathRadius, counterClockwise }: { pathRadius: number; counterClockwise: boolean }) {
	const radius = pathRadius;
	const rotation = counterClockwise ? 1 : 0;
	return `
      M ${VIEWBOX_CENTER_X},${VIEWBOX_CENTER_Y}
      m 0,-${radius}
      a ${radius},${radius} ${rotation} 1 1 0,${2 * radius}
      a ${radius},${radius} ${rotation} 1 1 0,-${2 * radius}
    `;
}

function getDashStyle({
	counterClockwise,
	dashRatio,
	pathRadius,
}: {
	counterClockwise: boolean;
	dashRatio: number;
	pathRadius: number;
}) {
	const diameter = Math.PI * 2 * pathRadius;
	const gapLength = (1 - dashRatio) * diameter;

	return {
		strokeDasharray: `${diameter}px ${diameter}px`,
		strokeDashoffset: `${counterClockwise ? -gapLength : gapLength}px`,
	};
}

export default Path;
