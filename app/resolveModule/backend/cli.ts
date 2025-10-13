import { DynamicModules } from "@app/resolveModule/backend";

export const getCliModules = async (): Promise<DynamicModules> => {
	const [
		{ default: NextCookie },
		{ default: NextSvgToPng },
		{ default: NextGetImageSizeFromImageData },
		{ default: NextGetImageFromDom },
		xmldom,
		{ cliLoadFont },
		{ default: NextGetImageByPath },
	] = await Promise.all([
		import("../../../apps/next/logic/NextCookie"),
		import("../../../apps/next/logic/NextSvgToPng"),
		import("../../../apps/next/logic/NextGetImageSizeFromImageData"),
		import("../../../apps/next/logic/NextGetImageFromDom"),
		import("@xmldom/xmldom"),
		import("@ext/pdfExport/fontLoaders/cliLoadFont"),
		import("../../../apps/next/logic/NextGetImageByPath"),
	]);

	return {
		Cookie: NextCookie,
		initWasm: () => Promise.resolve(),
		svgToPng: NextSvgToPng,
		getImageSizeFromImageData: NextGetImageSizeFromImageData,
		getImageFromDom: NextGetImageFromDom,
		moveToTrash: () => Promise.resolve(),
		getDOMParser: () => new xmldom.DOMParser() as any,
		getXMLSerializer: () => new xmldom.XMLSerializer() as any,
		setSessionData: () => Promise.resolve(),
		pdfLoadFont: cliLoadFont(),
		getImageByPath: NextGetImageByPath,
	};
};
