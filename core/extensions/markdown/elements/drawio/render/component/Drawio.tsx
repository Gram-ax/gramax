import styled from "@emotion/styled";
import { forwardRef, MutableRefObject, ReactElement, useLayoutEffect, useRef, useState } from "react";
import DiagramError from "@ext/markdown/elements/diagrams/component/DiagramError";
import t from "@ext/localization/locale/translate";
import Image from "@components/Atoms/Image/Image";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import { resolveImageKind } from "@components/Atoms/Image/resolveImageKind";
import OnLoadResourceService from "@ext/markdown/elements/copyArticles/onLoadResourceService";
import Skeleton from "@components/Atoms/Skeleton";
import getAdjustedSize from "@core-ui/utils/getAdjustedSize";

interface DrawioProps {
	id: string;
	src: string;
	title: string;
	width: string;
	height: string;
	openEditor?: () => void;
	className?: string;
	noEm?: boolean;
}

const Drawio = forwardRef((props: DrawioProps, refT: MutableRefObject<HTMLImageElement>): ReactElement => {
	const { id, src, title, width, height, className, openEditor, noEm } = props;
	const apiUrlCreator = ApiUrlCreatorService.value;
	const { useGetContent } = OnLoadResourceService.value;

	const ref = refT || useRef<HTMLImageElement>(null);
	const parentRef = useRef<HTMLDivElement>(null);

	const [imageSrc, setImageSrc] = useState<string>(null);
	const [isLoaded, setIsLoaded] = useState<boolean>(false);
	const [isError, setIsError] = useState<boolean>(false);
	const [size, setSize] = useState<{ width: string; height: string }>(null);

	const setSrc = (newSrc: Blob) => {
		if (imageSrc) URL.revokeObjectURL(imageSrc);
		setImageSrc(URL.createObjectURL(newSrc));
	};

	const onLoad = () => {
		if (!imageSrc) return;
		setIsLoaded(true);
	};

	useLayoutEffect(() => {
		if (!width?.endsWith("px")) return;
		const parentWidth = parentRef.current?.clientWidth;

		if (!parentWidth) return;
		const newSize = getAdjustedSize(parseFloat(width), parseFloat(height), parentWidth);
		const computedStyle = window.getComputedStyle(ref.current.parentElement);
		const offset = parseFloat(computedStyle.marginTop) + parseFloat(computedStyle.paddingTop);
		setSize({ width: newSize.width + "px", height: newSize.height + offset + "px" });
	}, [width, height]);

	useGetContent(src, apiUrlCreator, (buffer) => {
		if (!buffer || !buffer.byteLength) return setIsError(true);
		setIsLoaded(false);
		setSrc(new Blob([buffer], { type: resolveImageKind(buffer) }));
	});

	if (!src || isError)
		return <DiagramError error={{ message: t("diagram.error.cannot-get-data") }} diagramName="diagrams.net" />;

	return (
		<div ref={parentRef} data-qa="qa-drawio">
			<Skeleton isLoaded={isLoaded} width={size?.width} height={size?.height}>
				<div className={"drawio " + className} data-focusable="true">
					<Image
						ref={ref}
						id={id}
						realSrc={src}
						modalTitle={title}
						src={imageSrc}
						onLoad={onLoad}
						modalEdit={openEditor}
						modalStyle={{
							backgroundColor: "var(--color-diagram-bg)",
							borderRadius: "var(--radius-large)",
							padding: "20px",
						}}
					/>
				</div>
			</Skeleton>

			{title && !noEm && <em>{title}</em>}
		</div>
	);
});

export default styled(Drawio)`
	display: flex;
	justify-content: center;
	width: 100%;
	margin: 0.5em 0;
	background-color: var(--color-diagram-bg);
	border-radius: var(--radius-large);
	padding: 20px;

	img {
		background-color: unset;
		box-shadow: unset !important;
	}
`;
