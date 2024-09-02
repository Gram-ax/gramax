import styled from "@emotion/styled";
import { ReactElement, useRef } from "react";
import DiagramError from "@ext/markdown/elements/diagrams/component/DiagramError";
import t from "@ext/localization/locale/translate";
import Image from "@components/Atoms/Image/Image";

interface DrawioProps {
	id: string;
	realSrc: string;
	src: string;
	title: string;
	openEditor?: () => void;
	className?: string;
}

const Drawio = (props: DrawioProps): ReactElement => {
	const { id, realSrc, src, title, className, openEditor } = props;

	const ref = useRef<HTMLImageElement>(null);

	if (!src) return <DiagramError error={{ message: t("diagram.error.cannot-get-data") }} diagramName="Drawio" />;

	return (
		<div>
			<div className={"drawio " + className} data-focusable="true">
				<Image
					ref={ref}
					id={id}
					realSrc={realSrc}
					modalTitle={title}
					src={src}
					modalEdit={openEditor}
					modalStyle={{
						backgroundColor: "var(--color-diagram-bg)",
						borderRadius: "var(--radius-large)",
						padding: "20px",
					}}
				/>
			</div>
			{title && <em>{title}</em>}
		</div>
	);
};

export default styled(Drawio)`
	display: flex;
	justify-content: center;
	width: 100%;
	margin: 0.5em 0;
	background-color: var(--color-diagram-bg);
	border-radius: var(--radius-large);
	padding: 20px;

	> img {
		background-color: unset;
		box-shadow: unset !important;
	}
`;
