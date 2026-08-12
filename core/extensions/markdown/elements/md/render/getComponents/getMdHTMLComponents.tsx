import type HTMLComponents from "@ext/markdown/core/render/components/getComponents/HTMLComponents";
import { unSupportedElements } from "@ext/markdown/core/render/components/getComponents/HTMLComponents";
import HTMLAlfa from "@ext/markdown/elements/alfaBeta/render/components/HTMLAlfa";
import HTMLBeta from "@ext/markdown/elements/alfaBeta/render/components/HTMLBeta";
import HTMLCmd from "@ext/markdown/elements/cmd/render/HTMLCmd";
import HTMLFormula from "@ext/markdown/elements/formula/render/components/HTMLFormula";
import HTMLInclude from "@ext/markdown/elements/include/render/HTMLInclude";
import HTMLIssue from "@ext/markdown/elements/issue/render/HTMLIssue";
import HTMLKbd from "@ext/markdown/elements/kbd/render/HTMLKbd";
import HTMLModule from "@ext/markdown/elements/module/render/HTMLModule";
import See from "@ext/markdown/elements/see/render/See";
import HTMLSub from "@ext/markdown/elements/sub/render/components/HTMLSub";
import { TableDB } from "@ext/markdown/elements/tabledb/render/DbTable";
import HTMLTerm from "@ext/markdown/elements/term/render/HTMLTerm";
import HTMLWhen from "@ext/markdown/elements/whowhen/render/HTMLWhen";
import HTMLWho from "@ext/markdown/elements/whowhen/render/HTMLWho";
import type { ReactNode } from "react";

// biome-ignore lint/suspicious/noExplicitAny: dynamic component registry requires any
const getMdHTMLComponents = (html: HTMLComponents): { [name: string]: (props: any) => ReactNode } => {
	return {
		Include: HTMLInclude,
		"Db-diagram": html.getNullComponent(unSupportedElements["db-diagram"]),
		"Db-table": TableDB,
		"Img-h": () => <div data-component="images" data-unsupported="true"></div>,
		"Img-v": () => <div data-component="images" data-unsupported="true"></div>,
		Formula: HTMLFormula,
		Module: HTMLModule(html),
		Term: HTMLTerm,
		Issue: HTMLIssue(html),
		Alfa: HTMLAlfa,
		Beta: HTMLBeta,
		Who: HTMLWho(html),
		When: HTMLWhen(html),
		Kbd: HTMLKbd,
		See,
		Cmd: HTMLCmd(html),
		Sub: HTMLSub,
	};
};

export default getMdHTMLComponents;
