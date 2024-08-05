import SpinnerLoader from "@components/Atoms/SpinnerLoader";
import styled from "@emotion/styled";
import DiagramError from "@ext/markdown/elements/diagrams/component/DiagramError";
import { forwardRef, MutableRefObject } from "react";
import DiagramType from "../../../../../logic/components/Diagram/DiagramType";

const DiagramRender = styled(
	forwardRef(
		(
			{
				data,
				error,
				diagramName,
				className,
				background = true,
				dataFocusable = true,
			}: {
				data?: string;
				error?: Error;
				diagramName: DiagramType;
				className?: string;
				isFull?: boolean;
				background?: boolean;
				dataFocusable?: boolean;
			},
			ref?: MutableRefObject<HTMLDivElement>,
		) => {
			if (!data && !error)
				return (
					<div className={`${className} diagram-image`}>
						<SpinnerLoader width={75} height={75} />
					</div>
				);

			if (error) return <DiagramError error={error} diagramName={diagramName} />;

			return (
				<div
					className={`${className} ${background ? "diagram-background" : ""} diagram-image`}
					data-focusable={`${dataFocusable}`}
				>
					<div
						ref={ref}
						className={`${className} ${diagramName}-diagram`}
						contentEditable={false}
						dangerouslySetInnerHTML={{ __html: data }}
					/>
				</div>
			);
		},
	),
)`
	display: flex;
	width: 100%;
	margin: 1rem 0;
	align-items: center;
	justify-content: center;

	${(p) => {
		return p.diagramName == DiagramType["c4-diagram"]
			? `.${DiagramType["c4-diagram"]}-diagram {
					height: ${p.isFull ? "100%" : "33rem"} !important;
			}
			`
			: p.diagramName == DiagramType.mermaid
			? ` 
	div {
		width: 100%;
		height: 100%;
		font-size: 15px;
		align-items: center;
		display: flex !important;
		justify-content: space-around;
	}`
			: "";
	}}

	svg {
		background: none !important;
		height: ${(p) => (p.isFull ? "100%" : "auto")} !important;
		max-width: 100%;
		max-height: 100% !important;
	}
`;

export default DiagramRender;
