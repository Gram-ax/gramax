import SpinnerLoader from "@components/Atoms/SpinnerLoader";
import styled from "@emotion/styled";
import DiagramError from "@ext/markdown/elements/diagrams/component/DiagramError";
import { forwardRef, MutableRefObject, useEffect, useState } from "react";
import DiagramType from "../../../../../logic/components/Diagram/DiagramType";
import Lightbox from "@components/Atoms/Image/modalImage/Lightbox";
import { classNames } from "@components/libs/classNames";

interface DiagramProps {
	data?: string;
	error?: Error;
	diagramName: DiagramType;
	openEditor?: () => void;
	className?: string;
	isFull?: boolean;
	background?: boolean;
	dataFocusable?: boolean;
	title?: string;
	downloadSrc?: string;
	isFrozen?: boolean;
}

const DiagramRender = forwardRef((props: DiagramProps, ref?: MutableRefObject<HTMLDivElement>) => {
	const {
		data,
		error,
		diagramName,
		className,
		isFrozen,
		background = true,
		dataFocusable = true,
		title,
		downloadSrc,
		openEditor,
	} = props;

	const [imageSrc, setImageSrc] = useState<string>(null);
	const [isOpen, setOpen] = useState(false);

	const setSrc = (newSrc: Blob) => {
		if (imageSrc) URL.revokeObjectURL(imageSrc);
		setImageSrc(URL.createObjectURL(newSrc));
	};

	useEffect(() => {
		setSrc(new Blob([data], { type: "image/svg+xml" }));
	}, [data]);

	if (!data && !error)
		return (
			<div className={`${className} diagram-image`}>
				<SpinnerLoader width={75} height={75} />
			</div>
		);

	if (error) return <DiagramError error={error} diagramName={diagramName} />;

	return (
		<div
			className={classNames(`${className} diagram-image`, { "diagram-background": background })}
			data-focusable={`${dataFocusable}`}
		>
			{isOpen && (
				<Lightbox
					id={diagramName}
					src={imageSrc}
					title={title}
					onClose={() => setOpen(false)}
					openedElement={ref}
					downloadSrc={downloadSrc}
					modalEdit={openEditor}
					modalStyle={{
						display: "flex",
						justifyContent: "center",
						backgroundColor: diagramName === DiagramType.mermaid ? "var(--color-diagram-bg)" : "none",
						borderRadius: diagramName === DiagramType.mermaid ? "var(--radius-large)" : "none",
						width: diagramName === DiagramType.mermaid ? "50em" : "auto",
					}}
				/>
			)}
			<div
				ref={ref}
				className={classNames(className, { isFrozen }, [`${diagramName}-diagram`])}
				contentEditable={false}
				onClick={() => setOpen(true)}
				dangerouslySetInnerHTML={{ __html: data }}
			/>
		</div>
	);
});

export default styled(DiagramRender)`
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
			? ``
			: "";
	}}

	.isFrozen {
		opacity: 0.4;
	}

	svg {
		background: none !important;
		height: ${(p) => (p.isFull ? "100%" : "auto")} !important;
		max-width: 100%;
		max-height: 100% !important;
	}
`;
