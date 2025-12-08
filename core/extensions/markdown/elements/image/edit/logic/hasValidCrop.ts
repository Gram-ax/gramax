import { Crop } from "@ext/markdown/elements/image/edit/model/imageEditorTypes";

const hasValidCrop = (crop?: Partial<Crop>): crop is Crop => {
	if (!crop) return false;

	const { x, y, w, h } = crop;

	return (
		[x, y, w, h].every((v) => typeof v === "number" && Number.isFinite(v)) &&
		w > 0 &&
		h > 0 &&
		x >= 0 &&
		y >= 0 &&
		x + w <= 100 &&
		y + h <= 100
	);
};

export default hasValidCrop;
