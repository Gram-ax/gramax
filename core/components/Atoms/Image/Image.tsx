import {
	DetailedHTMLProps,
	forwardRef,
	Fragment,
	ImgHTMLAttributes,
	LegacyRef,
	ReactEventHandler,
	useState,
} from "react";
import Lightbox from "./modalImage/Lightbox";
import { ImageObject } from "@ext/markdown/elements/image/edit/model/imageEditorTypes";

interface ImageProps extends DetailedHTMLProps<ImgHTMLAttributes<HTMLImageElement>, HTMLImageElement> {
	realSrc: string;
	objects?: ImageObject[];
	onLoad?: ReactEventHandler<HTMLImageElement>;
	onError?: ReactEventHandler<HTMLImageElement>;
}

const Image = forwardRef((props: ImageProps, ref?: LegacyRef<HTMLImageElement>) => {
	const [isOpen, setOpen] = useState(false);
	const { id, src, alt, title, className, realSrc, objects, onLoad, onError } = props;

	return (
		<Fragment>
			<span className="lightbox">
				{isOpen && (
					<Lightbox
						large={src}
						realSrc={realSrc}
						objects={objects ?? []}
						onClose={() => setOpen(false)}
						noneShadow={false}
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
				data-focusable="true"
				onClick={() => setOpen(true)}
			/>
			{title && <em>{title}</em>}
		</Fragment>
	);
});

export default Image;
