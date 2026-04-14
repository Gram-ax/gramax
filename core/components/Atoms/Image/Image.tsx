import Caption from "@components/Atoms/Caption";
import ModalToOpenService from "@core-ui/ContextServices/ModalToOpenService/ModalToOpenService";
import ModalToOpen from "@core-ui/ContextServices/ModalToOpenService/model/ModalsToOpen";
import type { ImageObject } from "@ext/markdown/elements/image/edit/model/imageEditorTypes";
import {
	type ComponentProps,
	type CSSProperties,
	type DetailedHTMLProps,
	forwardRef,
	type ImgHTMLAttributes,
	type MutableRefObject,
	type ReactEventHandler,
	useCallback,
} from "react";
import { useDoubleTap } from "../../../ui-logic/hooks/useDoubleTap";
import type MediaPreview from "./modalImage/MediaPreview";

interface ImageProps extends DetailedHTMLProps<ImgHTMLAttributes<HTMLImageElement>, HTMLImageElement> {
	realSrc?: string;
	objects?: ImageObject[];
	onLoad?: ReactEventHandler<HTMLImageElement>;
	onError?: ReactEventHandler<HTMLImageElement>;
	modalEdit?: () => void;
	modalTitle?: string;
	modalStyle?: CSSProperties;
}

const Image = forwardRef((props: ImageProps, ref?: MutableRefObject<HTMLImageElement>) => {
	const { id, src, alt, title, className, realSrc, objects, modalStyle, modalTitle, modalEdit, onLoad, onError } =
		props;

	const onClick = useCallback(() => {
		ModalToOpenService.setValue<ComponentProps<typeof MediaPreview>>(ModalToOpen.MediaPreview, {
			id: realSrc,
			src: src,
			title: modalTitle,
			downloadSrc: realSrc,
			openedElement: ref,
			objects: objects ?? [],
			modalEdit: modalEdit,
			modalStyle: modalStyle,
			onClose: () => {
				ModalToOpenService.resetValue();
			},
		});
	}, [src, modalTitle, realSrc, objects, modalEdit, modalStyle]);

	const { onDoubleClick } = useDoubleTap({
		onDoubleTap: onClick,
		elementRef: ref,
		delay: 300,
		threshold: 50,
	});

	return (
		<>
			<img
				alt={alt}
				className={className}
				id={id}
				onDoubleClick={onDoubleClick}
				onError={onError}
				onLoad={onLoad}
				ref={ref}
				src={src}
			/>
			{title && <Caption>{title}</Caption>}
		</>
	);
});

export default Image;
