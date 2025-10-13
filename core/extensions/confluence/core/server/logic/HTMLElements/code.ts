import HTMLNodeConverter from "@ext/confluence/core/server/model/HTMLNodeConverter";

function extractCodeFromAc(el: Element): string {
	if (!el) return "";
	const raw = (el as HTMLElement).innerHTML.replace(/^<!--\[CDATA\[/, "").replace(/\]\](?:&gt;|>)\s*$/s, "");
	const ta = document.createElement("textarea");
	ta.innerHTML = raw;
	return ta.value.replace(/-->/g, " > ").replace(/\r\n?/g, "\n");
}

const code: HTMLNodeConverter = (codeNode) => {
	if (codeNode.nodeName.toLowerCase() === "ac:structured-macro") {
		const parameters = Array.from(codeNode.querySelectorAll("ac\\:parameter"));
		const plainTextBody = codeNode.querySelector("ac\\:plain-text-body");

		const languageParam = parameters.find((param) => param.getAttribute("ac:name") === "language");
		const language = languageParam ? languageParam.textContent : "";
		const textContent = extractCodeFromAc(plainTextBody);

		return {
			type: "code_block",
			attrs: {
				language,
			},
			content: [{ type: "text", text: textContent }],
		};
	}
	return { type: "text", marks: [{ type: "code" }], text: codeNode.textContent };
};

export default code;
