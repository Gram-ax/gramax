import {
	CSSProperties,
	DetailedHTMLProps,
	forwardRef,
	Fragment,
	ImgHTMLAttributes,
	MutableRefObject,
	ReactEventHandler,
	useCallback,
	useState,
} from "react";
import Lightbox from "./modalImage/Lightbox";
import { ImageObject } from "@ext/markdown/elements/image/edit/model/imageEditorTypes";

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
	const [isOpen, setOpen] = useState(false);
	const { id, src, alt, title, className, realSrc, objects, modalStyle, modalTitle, modalEdit, onLoad, onError } =
		props;

	const onClose = useCallback(() => {
		setOpen(false);
	}, []);

	const onClick = useCallback(() => {
		setOpen(true);
	}, []);

	return (
		<Fragment>
			<span className="lightbox">
				{isOpen && (
					<Lightbox
						id={id}
						src={src}
						title={modalTitle}
						downloadSrc={realSrc}
						objects={objects ?? []}
						modalEdit={modalEdit}
						onClose={onClose}
						openedElement={ref}
						modalStyle={modalStyle}
					/>
				)}
			</span>
			<img
				ref={ref}
				id={id}
				alt={alt}
				onLoad={onLoad}
				onError={onError}
				src={src}
				className={className}
				onDoubleClick={onClick}
			/>
			{title && <em>{title}</em>}
		</Fragment>
	);
});

export default Image;
