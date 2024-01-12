import styled from "@emotion/styled";
import SpinnerLoader from "../SpinnerLoader";
import Path from "./Path";
import { VIEWBOX_CENTER_X, VIEWBOX_CENTER_Y, VIEWBOX_HEIGHT, VIEWBOX_HEIGHT_HALF, VIEWBOX_WIDTH } from "./constants";

const CircularProgressbar = styled(
	({
		value,
		text = null,
		minValue = 0,
		maxValue = 100,
		circleRatio = 1,
		strokeWidth = 4,
		counterClockwise = false,
		className,
	}: {
		value: number;
		text?: string;
		maxValue?: number;
		minValue?: number;
		className?: string;
		circleRatio?: number;
		strokeWidth?: number;
		counterClockwise?: boolean;
	}) => {
		if (!value || value == maxValue) return <SpinnerLoader fullScreen />;

		if (!text) text = `${Math.min(100, value)}/${maxValue}`;
		const getPathRadius = () => {
			return VIEWBOX_HEIGHT_HALF - strokeWidth / 2;
		};

		const getPathRatio = () => {
			const boundedValue = Math.min(Math.max(value, minValue), maxValue);
			return (boundedValue - minValue) / (maxValue - minValue);
		};

		const pathRadius = getPathRadius();
		const pathRatio = getPathRatio();

		return (
			<div className={className} data-qa="loader">
				<svg className="circular-progressbar" viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}>
					<Path
						className="circular-progressbar-trail"
						counterClockwise={counterClockwise}
						dashRatio={circleRatio}
						pathRadius={pathRadius}
						strokeWidth={strokeWidth}
					/>
					<Path
						className="circular-progressbar-path"
						counterClockwise={counterClockwise}
						dashRatio={pathRatio * circleRatio}
						pathRadius={pathRadius}
						strokeWidth={strokeWidth}
					/>
					{text && (
						<text className="circular-progressbar-text" x={VIEWBOX_CENTER_X} y={VIEWBOX_CENTER_Y}>
							{text}
						</text>
					)}
				</svg>
			</div>
		);
	},
)`
	width: 100%;
	height: 100px;
	display: flex;
	flex-direction: row;
	justify-content: center;

	.circular-progressbar {
		width: 100%;
		vertical-align: middle;

		.circular-progressbar-path {
			stroke: var(--color-article-text);
			stroke-linecap: round;
			transition: stroke-dashoffset 0.5s ease 0s;
		}

		.circular-progressbar-trail {
			stroke: #d6d6d6;
			stroke-linecap: round;
		}

		.circular-progressbar-text {
			fill: var(--color-article-text);
			font-size: 20px;
			dominant-baseline: middle;
			text-anchor: middle;
		}
	}
`;

export default CircularProgressbar;
