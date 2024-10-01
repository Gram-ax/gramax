import { ImageDimensions } from "@ext/wordExport/options/WordTypes";
import sharp from "sharp";

const svgToPng = async (svg: string, size: ImageDimensions, scale: number): Promise<Buffer> => {
	return await sharp(Buffer.from(svg))
		.resize(Math.ceil(size.width * scale), Math.ceil(size.height * scale))
		.toBuffer();
};

export default svgToPng;
