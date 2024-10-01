import HTMLNodeConverter from "@ext/confluence/core/server/model/HTMLNodeConverter";

const code: HTMLNodeConverter = (codeNode) => {
	if (codeNode.nodeName.toLowerCase() === "ac:structured-macro") {
		const parameters = Array.from(codeNode.querySelectorAll("ac\\:parameter"));
		const plainTextBody = codeNode.querySelector("ac\\:plain-text-body");

		const languageParam = parameters.find((param) => param.getAttribute("ac:name") === "language");
		const language = languageParam ? languageParam.textContent : "";

		const textContent = plainTextBody.innerHTML.replace(/<!--|-->/g, "").replace(/\[CDATA\[|\]\]/g, "");
		console.log(textContent);
		return {
			type: "code_block",
			attrs: {
				params: { language },
			},
			content: [{ type: "text", text: textContent }],
		};
	}
	return { type: "text", marks: [{ type: "code" }], text: codeNode.textContent };
};

export default code;
