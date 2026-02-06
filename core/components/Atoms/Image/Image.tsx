import Caption from "@components/Atoms/Caption";
import ModalToOpenService from "@core-ui/ContextServices/ModalToOpenService/ModalToOpenService";
import ModalToOpen from "@core-ui/ContextServices/ModalToOpenService/model/ModalsToOpen";
import { ImageObject } from "@ext/markdown/elements/image/edit/model/imageEditorTypes";
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
import { useDoubleTap } from "../../../ui-logic/hooks/useDoubleTap";
import MediaPreview from "./modalImage/MediaPreview";

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
				alt={alt}
				className={className}
				id={id}
				onDoubleClick={onDoubleClick}
				onError={onError}
				onLoad={onLoad}
				onTouchStart={onTouchStart}
				ref={ref}
				src={src}
			/>
			{title && <Caption>{title}</Caption>}
		</>
	);
});

export default Image;
