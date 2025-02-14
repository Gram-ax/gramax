import { forwardRef } from "react";

const PlayButton = forwardRef<SVGSVGElement, { className?: string }>(({ className }, ref) => {
	return (
		<svg
			ref={ref}
			xmlns="http://www.w3.org/2000/svg"
			xmlnsXlink="http://www.w3.org/1999/xlink"
			fill="#ffffff"
			height="800px"
			width="800px"
			version="1.1"
			viewBox="0 0 17.804 17.804"
			xmlSpace="preserve"
			className={className}
		>
			<g>
				<g id="c98_play">
					<path d="M2.067,0.043C2.21-0.028,2.372-0.008,2.493,0.085l13.312,8.503c0.094,0.078,0.154,0.191,0.154,0.313    c0,0.12-0.061,0.237-0.154,0.314L2.492,17.717c-0.07,0.057-0.162,0.087-0.25,0.087l-0.176-0.04    c-0.136-0.065-0.222-0.207-0.222-0.361V0.402C1.844,0.25,1.93,0.107,2.067,0.043z" />
				</g>
				<g id="Capa_1_78_"></g>
			</g>
		</svg>
	);
});

export default PlayButton;
