import { blockLayouts, inlineLayouts } from "@ext/pdfExport/layouts";

const getLayout = (name: string) => {
	if (blockLayouts[name]) return blockLayouts[name];
	if (inlineLayouts[name]) return inlineLayouts[name];
};

export default getLayout;
