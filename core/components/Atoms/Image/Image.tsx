import resolveModule from "@app/resolveModule";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import { DetailedHTMLProps, Fragment, ImgHTMLAttributes, useState } from "react";
import Path from "../../../logic/FileProvider/Path/Path";
import { GifImage } from "./GifImage";
import Lightbox from "./modalImage/Lightbox";

const Image = ({
	id,
	src,
	alt,
	title,
	className,
}: DetailedHTMLProps<ImgHTMLAttributes<HTMLImageElement>, HTMLImageElement>) => {
	const apiUrlCreator = ApiUrlCreatorService.value;
	const data = resolveModule("useImage")(apiUrlCreator ? apiUrlCreator.getArticleResource(src) : null);

	const [isOpen, setOpen] = useState(false);

	if (new Path(src).extension == "gif") return <GifImage src={data} title={title} alt={alt} />;

	return (
		<Fragment>
			<span className="lightbox">
				{isOpen && <Lightbox large={data} onClose={() => setOpen(false)} noneShadow={false} />}
			</span>
			<img
				id={id}
				alt={alt}
				src={data}
				className={className}
				data-focusable="true"
				onClick={() => setOpen(true)}
			/>
			{title && <em>{title}</em>}
		</Fragment>
	);
};

export default Image;
