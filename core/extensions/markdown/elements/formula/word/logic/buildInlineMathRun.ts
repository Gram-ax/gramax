export const buildInlineMathRun = (
	mathComponent: any,
	style: string,
	ImportedXmlComponent: { new (name: string): any; fromXmlString(xml: string): any },
) => {
	if (!mathComponent) return null;

	const run = new ImportedXmlComponent("w:r");
	run.root = run.root || [];

	const rPr = new ImportedXmlComponent("w:rPr");
	rPr.root = rPr.root || [];

	const styleXml =
		`<w:rStyle xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" w:val="${style}"/>`;
	const styleComp = ImportedXmlComponent.fromXmlString(styleXml);
	const styleNode =
		(styleComp)?.rootKey === "w:rStyle"
			? styleComp
			: (styleComp)?.root?.find((c: any) => c?.rootKey === "w:rStyle") ?? styleComp;
	rPr.root.push(styleNode);

	run.root.push(rPr);
	run.root.push(mathComponent);

	return run;
};
