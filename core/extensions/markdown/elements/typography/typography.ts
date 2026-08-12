import { Extension, textInputRule } from "@tiptap/core";

type TypographyRule = { find: RegExp; replace: string };

const rules: Record<string, TypographyRule> = {
	dash: { find: /--$/, replace: "—" },
	ellipsis: { find: /\.\.\.$/, replace: "…" },
	rightArrow: { find: /(?:—>|->)$/, replace: "→" },
	leftArrow: { find: /(?:<-|<-)$/, replace: "←" },
	bidirectionalArrow: { find: /<->$/, replace: "↔" },
	doubleRightArrow: { find: /=>$/, replace: "⇒" },
	doubleLeftRightArrow: { find: /\s?<=>$/, replace: "⇔" },
	upArrow: { find: /\(up\)$/i, replace: "↑" },
	downArrow: { find: /\(down\)$/i, replace: "↓" },
	openDoubleQuote: { find: /(?:^|[\s{[(<'"‘“])(")$/, replace: "«" },
	closeDoubleQuote: { find: /"$/, replace: "»" },
	openSingleQuote: { find: /(?:^|[\s{[(<'"‘“])(')$/, replace: "‘" },
	closeSingleQuote: { find: /'$/, replace: "’" },
	laquo: { find: /<<$/, replace: "«" },
	raquo: { find: />>$/, replace: "»" },
	copyright: { find: /\(c\)$/, replace: "©" },
	trademark: { find: /\(tm\)$/, replace: "™" },
	registeredTrademark: { find: /\(r\)$/, replace: "®" },
	plusMinus: { find: /\+\/-$/, replace: "±" },
	notEqual: { find: /!=$/, replace: "≠" },
	lessOrEqual: { find: /<=$/, replace: "≤" },
	greaterOrEqual: { find: />=$/, replace: "≥" },
	approximately: { find: /\(approx\)$/i, replace: "≈" },
	multiplication: { find: /\d+\s?([*x])\s?\d+$/, replace: "×" },
	oneHalf: { find: /1\/2$/, replace: "½" },
	oneQuarter: { find: /1\/4$/, replace: "¼" },
	threeQuarters: { find: /3\/4$/, replace: "¾" },
	superscriptZero: { find: /\^0$/, replace: "⁰" },
	superscriptOne: { find: /\^1$/, replace: "¹" },
	superscriptTwo: { find: /\^2$/, replace: "²" },
	superscriptThree: { find: /\^3$/, replace: "³" },
	superscriptFour: { find: /\^4$/, replace: "⁴" },
	superscriptFive: { find: /\^5$/, replace: "⁵" },
	superscriptSix: { find: /\^6$/, replace: "⁶" },
	superscriptSeven: { find: /\^7$/, replace: "⁷" },
	superscriptEight: { find: /\^8$/, replace: "⁸" },
	superscriptNine: { find: /\^9$/, replace: "⁹" },
	euroSign: { find: /\(eur\)$/i, replace: "€" },
	poundSign: { find: /\(gbp\)$/i, replace: "£" },
	yenSign: { find: /\(yen\)$/i, replace: "¥" },
	rubleSign: { find: /\(rub\)$/i, replace: "₽" },
	degreeSign: { find: /\(deg\)$/i, replace: "°" },
	microSign: { find: /\(micro\)$/i, replace: "µ" },
	numberSign: { find: /\(no\)$/i, replace: "№" },
	sectionSign: { find: /\(sect\)$/i, replace: "§" },
	bulletPoint: { find: /\(bullet\)$/i, replace: "•" },
	dagger: { find: /\(dagger\)$/i, replace: "†" },
	squareRoot: { find: /\(sqrt\)$/i, replace: "√" },
	summation: { find: /\(sum\)$/i, replace: "∑" },
	infinity: { find: /\(inf\)$/i, replace: "∞" },
	emptySet: { find: /\(empty\)$/i, replace: "∅" },
	elementOf: { find: /\(in\)$/i, replace: "∈" },
	forAll: { find: /\(forall\)$/i, replace: "∀" },
	thereExists: { find: /\(exists\)$/i, replace: "∃" },
	piSymbol: { find: /\(pi\)$/i, replace: "π" },
	alphaSymbol: { find: /\(alpha\)$/i, replace: "α" },
	betaSymbol: { find: /\(beta\)$/i, replace: "β" },
	gammaSymbol: { find: /\(gamma\)$/i, replace: "γ" },
	deltaSymbol: { find: /\(delta\)$/i, replace: "δ" },
	epsilonSymbol: { find: /\(epsilon\)$/i, replace: "ε" },
	lambdaSymbol: { find: /\(lambda\)$/i, replace: "λ" },
	muSymbol: { find: /\(mu\)$/i, replace: "μ" },
	sigmaSymbol: { find: /\(sigma\)$/i, replace: "σ" },
	omegaSymbol: { find: /\(omega\)$/i, replace: "ω" },
	thetaSymbol: { find: /\(theta\)$/i, replace: "θ" },
};

export type TypographyOptions = { [K in keyof typeof rules]: false };

const Typography = Extension.create<TypographyOptions>({
	name: "typography",

	addInputRules() {
		return Object.entries(rules)
			.filter(([key]) => this.options[key as keyof TypographyOptions] !== false)
			.map(([, rule]) => textInputRule(rule));
	},
});

export default Typography;
