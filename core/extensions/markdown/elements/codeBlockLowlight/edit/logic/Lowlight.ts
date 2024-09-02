import curl from "@ext/markdown/elements/codeBlockLowlight/edit/logic/langs/curl";
import noneLang from "@ext/markdown/elements/codeBlockLowlight/edit/logic/langs/none";
import { common, createLowlight } from "lowlight";
import oneC from "highlight.js/lib/languages/1c";
import gherkin from "highlight.js/lib/languages/gherkin";
import type { LanguageFn } from "highlight.js";

const lowlight = createLowlight(common);
const { xmlHLJS } = getXmlLangFromHtml(common);

const languagesToRegister: Record<string, LanguageFn> = {
	none: noneLang,
	gherkin: gherkin,
	curl: curl,
	html: xmlHLJS,
	"1c": oneC,
};

Object.entries(languagesToRegister).forEach(([languageName, coloringFunction]) =>
	lowlight.register(languageName, coloringFunction),
);

function getXmlLangFromHtml(data: Record<string, LanguageFn>) {
	const xmlHLJS = data["xml"];
	return { xmlHLJS };
}

export default lowlight;
