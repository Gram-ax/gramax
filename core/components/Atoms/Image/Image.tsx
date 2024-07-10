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
import { Crop, ImageObject } from "@ext/markdown/elements/image/edit/model/imageEditorTypes";

interface ImageProps extends DetailedHTMLProps<ImgHTMLAttributes<HTMLImageElement>, HTMLImageElement> {
	realSrc: string;
	objects?: ImageObject[];
	crop?: Crop;
	onLoad?: ReactEventHandler<HTMLImageElement>;
}

const Image = forwardRef((props: ImageProps, ref?: LegacyRef<HTMLImageElement>) => {
	const [isOpen, setOpen] = useState(false);
	const { id, src, alt, title, className, realSrc, crop, objects, onLoad } = props;

	return (
		<Fragment>
			<span className="lightbox">
				{isOpen && (
					<Lightbox
						large={src}
						realSrc={realSrc}
						crop={crop}
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
