import styled from "@emotion/styled";
import { CSSProperties } from "react";

const SpinnerLoader = styled(
	({
		fullScreen = false,
		style,
		className,
	}: {
		fullScreen?: boolean;
		style?: CSSProperties;
		className?: string;
		width?: number;
		height?: number;
		lineWidth?: number;
	}) => {
		const Spinner = (
			<div data-qa="loader" className={className}>
				<div className="spinner" />
			</div>
		);
		if (fullScreen)
			return (
				<div
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
		return Spinner;
	},
)`
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
		width: 100%;
		height: 100%;

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

export default SpinnerLoader;
