import { resolveFileKind } from "@core-ui/utils/resolveFileKind";
import { getCroppedCanvas } from "@ext/markdown/elements/image/edit/logic/imageEditorMethods";
import { Crop } from "@ext/markdown/elements/image/edit/model/imageEditorTypes";

export const cropImage = async (
	imageContainer: HTMLDivElement,
	crop: Crop,
	realSrc: string,
	originalBuffer: Buffer,
): Promise<Blob> => {
	if (!crop) return getBlobFromBuffer(originalBuffer);
	const blob = await getCroppedCanvas(imageContainer, crop, realSrc, originalBuffer);

	if (!blob) return getBlobFromBuffer(originalBuffer);
	return blob;
};

export const getBlobFromBuffer = (buffer: Buffer) => {
	return new Blob([buffer], { type: resolveFileKind(buffer) });
};
