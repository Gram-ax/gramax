import Image from "@components/Atoms/Image/Image";
import Skeleton from "@components/Atoms/ImageSkeleton";
import getAdjustedSize from "@core-ui/utils/getAdjustedSize";
import { resolveFileKind } from "@core-ui/utils/resolveFileKind";
import styled from "@emotion/styled";
import t from "@ext/localization/locale/translate";
import BlockCommentView from "@ext/markdown/elements/comment/edit/components/View/BlockCommentView";
import ResourceService from "@ext/markdown/elements/copyArticles/resourceService";
import DiagramError from "@ext/markdown/elements/diagrams/component/DiagramError";
import { forwardRef, MutableRefObject, ReactElement, useLayoutEffect, useRef, useState } from "react";

interface DrawioProps {
	id: string;
	src: string;
	title: string;
	width: string;
	height: string;
	openEditor?: () => void;
	className?: string;
	noEm?: boolean;
	commentId?: string;
	isPrint?: boolean;
}

const Drawio = forwardRef((props: DrawioProps, refT: MutableRefObject<HTMLImageElement>): ReactElement => {
	const { id, src, title, width, height, className, openEditor, noEm, commentId, isPrint } = props;
	const { useGetResource } = ResourceService.value;

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

	useGetResource(
		(buffer, resourceError) => {
			if (resourceError) {
				return setIsError(true);
			}
			if (!buffer || !buffer.byteLength) return setIsError(true);
			setIsLoaded(false);
			setSrc(new Blob([buffer], { type: resolveFileKind(buffer) }));
		},
		src,
		undefined,
		undefined,
		isPrint,
	);

	if (!src || isError)
		return <DiagramError diagramName="diagrams.net" error={{ message: t("diagram.error.cannot-get-data") }} />;

	return (
		<div data-qa="qa-drawio" ref={parentRef}>
			<BlockCommentView commentId={commentId} style={{ borderRadius: "var(--radius-large)" }}>
				<Skeleton height={size?.height} isLoaded={isLoaded} width="100%">
					<div className={className} data-focusable="true">
						<div className="drawio">
							<Image
								id={id}
								modalEdit={openEditor}
								modalStyle={{
									backgroundColor: "var(--color-diagram-bg)",
									borderRadius: "var(--radius-large)",
									padding: "20px",
								}}
								modalTitle={title}
								onLoad={onLoad}
								realSrc={src}
								ref={ref}
								src={imageSrc}
							/>
						</div>
					</div>
				</Skeleton>
			</BlockCommentView>

			{title && !noEm && <em>{title}</em>}
		</div>
	);
});

export default styled(Drawio)`
	width: 100%;
	background-color: var(--color-diagram-bg);
	border-radius: var(--radius-large);

	.drawio {
		display: flex;
		justify-content: center;
		padding: 0.8em;
		margin: 0.5em 0;
	}

	img {
		background-color: unset;
		box-shadow: unset !important;
	}
`;
