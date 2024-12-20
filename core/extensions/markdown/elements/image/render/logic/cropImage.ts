import { resolveImageKind } from "@components/Atoms/Image/resolveImageKind";
import { getCroppedCanvas } from "@ext/markdown/elements/image/edit/logic/imageEditorMethods";
import { Crop } from "@ext/markdown/elements/image/edit/model/imageEditorTypes";

export const cropImage = async (
	imageContainer: HTMLDivElement,
	crop: Crop,
	realSrc: string,
	originalBuffer: Buffer,
): Promise<Blob> => {
	if (!crop) return new Blob([originalBuffer], { type: resolveImageKind(originalBuffer) });
	const blob = await getCroppedCanvas(imageContainer, crop, realSrc, originalBuffer);

	if (!blob) return new Blob([originalBuffer], { type: resolveImageKind(originalBuffer) });
	return blob;
};
