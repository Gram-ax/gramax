import styled from "@emotion/styled";
import { CSSProperties, forwardRef } from "react";

interface SpinnerLoaderProps {
	fullScreen?: boolean;
	style?: CSSProperties;
	className?: string;
	width?: number;
	height?: number;
	lineWidth?: number;
}

const SpinnerLoader = forwardRef<HTMLDivElement, SpinnerLoaderProps>(
	({ fullScreen = false, style, className }, ref) => {
		const Spinner = (
			<div className={className} data-qa="loader">
				<div className="spinner" />
			</div>
		);

		if (fullScreen)
			return (
				<div
					ref={ref}
					style={{
						width: "100%",
						height: "100%",
						display: "flex",
						overflow: "hidden",
						justifyContent: "center",
						alignItems: "center",
						...style,
					}}
				>
					{Spinner}
				</div>
			);

		return <div ref={ref}>{Spinner}</div>;
	},
);

export default styled(SpinnerLoader)`
	position: relative;
	color: var(--color-article-text);
	width: ${(p) => `${p.width ?? "100"}px !important`};
	min-width: ${(p) => `${p.width ?? "100"}px`};
	height: ${(p) => `${p.height ?? "100"}px !important`};
	min-height: ${(p) => `${p.height ?? "100"}px`};
	@keyframes spinner {
		to {
			transform: rotate(360deg);
		}
	}

	.spinner {
		text-align: justify;
		width: 100%;
		height: 100%;
		text-align: justify;

		:before {
			content: "";
			box-sizing: border-box;
			position: absolute;
			width: 100%;
			height: 100%;
			border-radius: 50%;
			border: ${(p) => p.lineWidth ?? 3}px solid #ccc;
			border-top-color: #000;
			animation: spinner 0.6s linear infinite;
		}
	}
`;
