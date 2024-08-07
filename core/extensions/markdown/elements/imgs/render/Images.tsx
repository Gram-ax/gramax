import Image from "@ext/markdown/elements/image/render/components/Image";

const Images = ({ images, postfix }: { postfix: string; images: string[] }) => {
	return (
		<span className={`img-${postfix}`} contentEditable={false} data-type={`img${postfix}`}>
			{images.map((src, idx) => {
				return <Image src={src} key={idx} />;
			})}
		</span>
	);
};
export default Images;
