import docx from "@dynamicImports/docx";
import mathjaxOmml from "@dynamicImports/mathjaxOmml";
import { STATE } from "mathjax-full/js/core/MathItem.js";
import { xml2js } from "xml-js";

type MathJaxOmmlLoaded = Awaited<ReturnType<typeof mathjaxOmml>>;

type MathJaxEnvironment = {
	document: ReturnType<MathJaxOmmlLoaded["mathjax"]["document"]>;
	visitor: InstanceType<MathJaxOmmlLoaded["SerializedMmlVisitor"]>;
};

export type OmmlResult = { component: any; omml: string };

let mathJaxEnvironment: MathJaxEnvironment | null = null;
const conversionCache = new Map<string, OmmlResult>();
let cachedMathJaxOmmlBundle: MathJaxOmmlLoaded | null = null;
let cachedTexPackages: string[] | null = null;

async function loadMathJaxOmmlBundle() {
	if (cachedMathJaxOmmlBundle) return cachedMathJaxOmmlBundle;
	cachedMathJaxOmmlBundle = await mathjaxOmml();
	return cachedMathJaxOmmlBundle;
}

async function ensureMathJaxEnvironment() {
	if (mathJaxEnvironment) return mathJaxEnvironment;

	const { mathjax, liteAdaptor, RegisterHTMLHandler, TeX, AllPackages, SerializedMmlVisitor } =
		await loadMathJaxOmmlBundle();

	const adaptor = liteAdaptor();
	RegisterHTMLHandler(adaptor);

	if (!cachedTexPackages) cachedTexPackages = AllPackages.filter((pkg) => pkg !== "bussproofs");

	const tex = new TeX({ packages: cachedTexPackages });
	const document = mathjax.document("", {
		InputJax: tex,
	});

	const visitor = new SerializedMmlVisitor();
	mathJaxEnvironment = { document, visitor };

	return mathJaxEnvironment;
}

async function latexToMathMl(latexString: string, display: boolean): Promise<string> {
	const { document, visitor } = await ensureMathJaxEnvironment();
	const mathNode = document.convert(latexString, {
		display,
		end: STATE.CONVERT,
	});

	return visitor.visitTree(mathNode);
}

async function mathMlToOmml(mathMlString: string): Promise<string> {
	const { mml2omml } = await loadMathJaxOmmlBundle();
	return mml2omml(mathMlString, { disableDecode: true });
}

async function ommlToComponent(ommlString: string) {
	const parsed = xml2js(ommlString, {
		compact: false,
		ignoreDeclaration: true,
		ignoreComment: true,
	});

	const elements = parsed?.elements ?? [];
	const mathElement = elements.find((element: any) => element.type === "element" && element.name === "m:oMath");

	if (!mathElement) {
		throw new Error("Invalid OMML content: missing m:oMath element");
	}

	const { convertToXmlComponent } = await docx();
	const component = convertToXmlComponent(mathElement);

	if (!component || (component as any).rootKey !== "m:oMath") {
		throw new Error("Failed to convert OMML element");
	}

	return component;
}

export async function latexToOmmlComponent(latexString: string, display = false): Promise<OmmlResult | null> {
	if (!latexString?.trim()) return null;

	const cacheKey = `${display ? "D" : "I"}|${latexString}`;
	const cached = conversionCache.get(cacheKey);
	if (cached) return cached;

	const mathMlString = await latexToMathMl(latexString, display);
	const ommlString = await mathMlToOmml(mathMlString);
	const component = await ommlToComponent(ommlString);

	const result = { component, omml: ommlString };
	conversionCache.set(cacheKey, result);
	return result;
}
