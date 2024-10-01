import { toBlob } from "html-to-image";

const getImageFromDom = async (tag: string, fitContent: boolean) => {
	const dom = document.createElement("div");
	dom.innerHTML = tag.trim();

	dom.className = "imageRenderer";
	if (fitContent) {
		dom.style.width = "fit-content";
		dom.style.height = "fit-content";
	}

	document.body.append(dom);
	const imageBlob = await toBlob(dom);
	dom.remove();

	return Buffer.from(await imageBlob.arrayBuffer());
};

export default getImageFromDom;
