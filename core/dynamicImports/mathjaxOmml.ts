import { createDynamicImport } from "./createDynamicImport";

export const mathjaxOmml = createDynamicImport({
	importFunction: () =>
		Promise.all([
			import("mathjax-full/js/mathjax.js"),
			import("mathjax-full/js/input/tex.js"),
			import("mathjax-full/js/input/tex/AllPackages.js"),
			import("mathjax-full/js/adaptors/liteAdaptor.js"),
			import("mathjax-full/js/handlers/html.js"),
			import("mathjax-full/js/core/MmlTree/SerializedMmlVisitor.js"),
			import("mathml2omml"),
		]).then(([mathjax, tex, allPackages, adaptor, handler, visitor, mml2omml]) => ({
			mathjax: mathjax.mathjax,
			TeX: tex.TeX,
			AllPackages: allPackages.AllPackages,
			liteAdaptor: adaptor.liteAdaptor,
			RegisterHTMLHandler: handler.RegisterHTMLHandler,
			SerializedMmlVisitor: visitor.SerializedMmlVisitor,
			mml2omml: mml2omml.mml2omml,
		})),
});

export default mathjaxOmml;
