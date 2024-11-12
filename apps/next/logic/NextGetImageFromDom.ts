import { ImageDimensionsFinder } from "@ext/markdown/elements/image/word/ImageDimensionsFinder";
import { MAX_WIDTH, SCALE } from "@ext/wordExport/options/wordExportSettings";
import NextSvgToPng from "./NextSvgToPng";

const getImageFromDom = async (tag: string) => {
	return NextSvgToPng(tag, ImageDimensionsFinder.getSvgDimensions(tag, MAX_WIDTH), SCALE);
};

export default getImageFromDom;
