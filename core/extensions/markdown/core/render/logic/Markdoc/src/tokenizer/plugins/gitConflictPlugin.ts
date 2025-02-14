import type MarkdownIt from "markdown-it/lib";

const OPEN = "<<<<<<<";
const MID = "=======";
const CLOSE = ">>>>>>>";

function addParagraph(state, startLine, endLine, content) {
	const token = state.push("paragraph_open", "p", 1);
	token.map = [startLine, endLine];

	const inlineToken = state.push("inline", "", 0);
	inlineToken.content = content;
	inlineToken.map = [startLine, endLine];
	inlineToken.children = [];

	state.push("paragraph_close", "p", -1);
}

export function gitConflictPlugin(md: MarkdownIt) {
	function block(state, startLine, endLine, silent) {
		const start = state.bMarks[startLine] + state.tShift[startLine];
		const firstLine = state.src.slice(start, state.eMarks[startLine]);

		if (!firstLine.startsWith(OPEN)) {
			return false;
		}

		let nextLine = startLine + 1;
		let foundMid = false;
		let foundEnd = false;

		while (nextLine < endLine) {
			const lineStart = state.bMarks[nextLine] + state.tShift[nextLine];
			const lineEnd = state.eMarks[nextLine];
			const line = state.src.slice(lineStart, lineEnd);

			if (line.startsWith(MID)) {
				foundMid = true;
			} else if (line.startsWith(CLOSE)) {
				foundEnd = true;
				break;
			}

			nextLine++;
		}

		if (!foundMid || !foundEnd) {
			return false;
		}

		if (silent) {
			return true;
		}

		const contentStart = state.bMarks[startLine];
		const content = state.src.slice(contentStart, state.eMarks[nextLine]);

		const contentLines = content
			.split("\n")
			.map((line) => line.trim())
			.join("\n");

		addParagraph(state, startLine, nextLine + 1, contentLines);

		state.line = nextLine + 1;

		return true;
	}

	md.block.ruler.before("paragraph", "git_conflict", block, {
		alt: ["paragraph", "reference", "blockquote", "list"],
	});
}
