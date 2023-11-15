import { alphaWordLayout, betaWordLayout } from "../markdown/elements/alfaBeta/word/alfabeta";
import { brWordLayout } from "../markdown/elements/br/word/br";
import { cmdWordLayout } from "../markdown/elements/cmd/word/cmd";
import { codeWordLayout } from "../markdown/elements/code/word/code";
import { colorWordLayout } from "../markdown/elements/color/word/color";
import { cutInlineWordLayout } from "../markdown/elements/cut/word/cutInline";
import { emWordLayout } from "../markdown/elements/em/word/em";
import { formulaWordLayout } from "../markdown/elements/formula/word/formula";
import { imageWordLayout } from "../markdown/elements/image/word/image";
import { issueWordLayout } from "../markdown/elements/issue/word/issue";
import { kbdWordLayout } from "../markdown/elements/kbd/word/kbd";
import { linkWordLayout } from "../markdown/elements/link/word/link";
import { moduleWordLayout } from "../markdown/elements/module/word/module";
import { strongWordLayout } from "../markdown/elements/strong/word/strong";
import { termWordLayout } from "../markdown/elements/term/word/term";
import { whenWordLayout } from "../markdown/elements/whowhen/word/when";
import { whoWordLayout } from "../markdown/elements/whowhen/word/who";
import { WordInlineChilds } from "./WordTypes";

export const getInlineChilds: () => WordInlineChilds = () => ({
	strong: strongWordLayout,
	em: emWordLayout,
	Link: linkWordLayout,
	Image: imageWordLayout,
	Code: codeWordLayout,
	Br: brWordLayout,
	br: brWordLayout,
	Color: colorWordLayout,
	Alfa: alphaWordLayout,
	Beta: betaWordLayout,
	Who: whoWordLayout,
	When: whenWordLayout,
	Issue: issueWordLayout,
	Kbd: kbdWordLayout,
	Cmd: cmdWordLayout,
	Module: moduleWordLayout,
	Formula: formulaWordLayout,
	Cut: cutInlineWordLayout,
	Term: termWordLayout,
});
