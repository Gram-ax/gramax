import curl from "@ext/markdown/elements/codeBlockLowlight/edit/logic/langs/curl";
import oneC from "@ext/markdown/elements/codeBlockLowlight/edit/logic/langs/1c";
import gherkin from "@ext/markdown/elements/codeBlockLowlight/edit/logic/langs/gherkin";
import noneLang from "@ext/markdown/elements/codeBlockLowlight/edit/logic/langs/none";
import { common, createLowlight } from "lowlight";
import type { LanguageFn } from "highlight.js";
import Delphi from "highlight.js/lib/languages/delphi";
import PowerShell from "highlight.js/lib/languages/powershell";
const lowlight = createLowlight(common);
const { xmlHLJS } = getXmlLangFromHtml(common);

const languagesToRegister: Record<string, LanguageFn> = {
	none: noneLang,
	gherkin: gherkin,
	curl: curl,
	html: xmlHLJS,
	"1c": oneC,
	pascal: Delphi,
	delphi: Delphi,
	powershell: PowerShell,
};

Object.entries(languagesToRegister).forEach(([languageName, coloringFunction]) =>
	lowlight.register(languageName, coloringFunction),
);

function getXmlLangFromHtml(data: Record<string, LanguageFn>) {
	const xmlHLJS = data["xml"];
	return { xmlHLJS };
}

export default lowlight;
