import styled from "@emotion/styled";
import { ReactElement, useRef, useState } from "react";
import DiagramError from "@ext/markdown/elements/diagrams/component/DiagramError";
import t from "@ext/localization/locale/translate";
import Image from "@components/Atoms/Image/Image";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import OnLoadResourceService from "@ext/markdown/elements/copyArticles/onLoadResourceService";
import { resolveImageKind } from "@components/Atoms/Image/resolveImageKind";

interface DrawioProps {
	id: string;
	src: string;
	title: string;
	openEditor?: () => void;
	className?: string;
}

const Drawio = (props: DrawioProps): ReactElement => {
	const { id, src, title, className, openEditor } = props;
	const apiUrlCreator = ApiUrlCreatorService.value;

	const ref = useRef<HTMLImageElement>(null);

	const [imageSrc, setImageSrc] = useState<string>(null);
	const [isError, setIsError] = useState<boolean>(false);

	const setSrc = (newSrc: Blob) => {
		if (imageSrc) URL.revokeObjectURL(imageSrc);
		setImageSrc(URL.createObjectURL(newSrc));
	};

	OnLoadResourceService.useGetContent(src, apiUrlCreator, (buffer) => {
		if (!buffer.byteLength) return setIsError(true);
		setSrc(new Blob([buffer], { type: resolveImageKind(buffer) }));
	});

	if (!src || isError)
		return <DiagramError error={{ message: t("diagram.error.cannot-get-data") }} diagramName="diagrams.net" />;

	return (
		<div>
			<div className={"drawio " + className} data-focusable="true">
				<Image
					ref={ref}
					id={id}
					realSrc={src}
					modalTitle={title}
					src={imageSrc}
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
