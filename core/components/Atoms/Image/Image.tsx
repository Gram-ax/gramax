import {
	ComponentProps,
	CSSProperties,
	DetailedHTMLProps,
	forwardRef,
	ImgHTMLAttributes,
	MutableRefObject,
	ReactEventHandler,
	useCallback,
} from "react";
import MediaPreview from "./modalImage/MediaPreview";
import { ImageObject } from "@ext/markdown/elements/image/edit/model/imageEditorTypes";
import { useDoubleTap } from "../../../ui-logic/hooks/useDoubleTap";
import ModalToOpenService from "@core-ui/ContextServices/ModalToOpenService/ModalToOpenService";
import ModalToOpen from "@core-ui/ContextServices/ModalToOpenService/model/ModalsToOpen";

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

	const { onTouchStart, onDoubleClick } = useDoubleTap({
		onDoubleTap: onClick,
		delay: 300,
		threshold: 50,
	});

	return (
		<>
			<img
				ref={ref}
				id={id}
				alt={alt}
				onLoad={onLoad}
				onError={onError}
				src={src}
				className={className}
				onDoubleClick={onDoubleClick}
				onTouchStart={onTouchStart}
			/>
			{title && <em>{title}</em>}
		</>
	);
});

export default Image;
