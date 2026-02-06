import ApiUrlCreator from "@core-ui/ApiServices/ApiUrlCreator";
import { RESTORE_SELECTION_META_KEY, SAVE_SELECTION_META_KEY } from "@ext/ai/logic/plugins/BlurSelection/consts";
import TiptapGramaxAi from "@ext/ai/logic/TiptapGramaxAi";
import { createLoadingDecoration } from "@ext/ai/logic/utils";
import { AiGenerateOptions, AiPrettifyOptions, AiTranscribeOptions } from "@ext/ai/models/types";
import t from "@ext/localization/locale/translate";
import { CommandProps } from "@tiptap/core";

const getInsertContentOptions = () => {
	return {
		updateSelection: true,
		parseOptions: { preserveWhitespace: false },
	};
};

export const prettify =
	(apiUrlCreator: ApiUrlCreator) =>
	(options: AiPrettifyOptions) =>
	({ editor }: CommandProps) => {
		const ai = new TiptapGramaxAi(apiUrlCreator, editor.schema);

		const { selection } = editor.state;
		const $from = selection.$from;
		const $to = selection.$to;

		const from = $from.start();
		const to = $to.pos;

		const decorations = createLoadingDecoration(from, to);

		editor.commands.setMeta("addDecoration", decorations);
		editor.setEditable(false);

		const nodes = editor.state.doc.slice(from, to);

		void ai
			.prettify(nodes.content, options.command)
			.then((html) => {
				editor
					.chain()
					.setMeta("removeDecoration", true)
					.deleteRange({ from, to })
					.insertContentAt(from, html, getInsertContentOptions())
					.run();
				editor.setEditable(true);

				return html;
			})
			.catch(() => {
				editor.commands.setMeta("removeDecoration", true);
				editor.setEditable(true);
			});

		return true;
	};

export const generate =
	(apiUrlCreator: ApiUrlCreator) =>
	(options: AiGenerateOptions) =>
	({ editor }: CommandProps) => {
		const ai = new TiptapGramaxAi(apiUrlCreator, editor.schema);

		const { selection } = editor.state;
		const from = selection.from;
		const to = selection.to;
		const $from = selection.$from;
		const hasContent =
			($from.node().type.name !== "text" ? $from.node().textContent : $from.node().text).length > 0;

		const isBlock = from === to && !hasContent;
		const decorations = createLoadingDecoration(from, to, isBlock, t("ai.generating"));

		editor.commands.setMeta("addDecoration", decorations);
		editor.setEditable(false);

		void ai
			.generate(options.command)
			.then((html) => {
				editor
					.chain()
					.setMeta("removeDecoration", true)
					.deleteRange({ from, to })
					.insertContentAt(from, html, getInsertContentOptions())
					.run();
				editor.setEditable(true);

				return html;
			})
			.catch(() => {
				editor.commands.setMeta("removeDecoration", true);
				editor.setEditable(true);
			});

		return true;
	};

export const saveSelection =
	() =>
	({ commands, editor }: CommandProps) => {
		const { selection } = editor.state;
		const from = selection.from;
		const to = selection.to;

		return commands.setMeta(SAVE_SELECTION_META_KEY, { from, to });
	};

export const restoreSelection =
	() =>
	({ commands }: CommandProps) =>
		commands.setMeta(RESTORE_SELECTION_META_KEY, true);

export const transcribe =
	(apiUrlCreator: ApiUrlCreator) =>
	(options: AiTranscribeOptions) =>
	({ editor }: CommandProps) => {
		const ai = new TiptapGramaxAi(apiUrlCreator, editor.schema);

		const { selection } = editor.state;
		const from = selection.from;
		const to = selection.to;

		const decorations = createLoadingDecoration(from, to, true, t("ai.transcribtion"));

		editor.commands.setMeta("addDecoration", decorations);
		editor.setEditable(false);

		void ai
			.transcribe(options.buffer)
			.then((text) => {
				editor
					.chain()
					.setMeta("removeDecoration", true)
					.deleteRange({ from, to })
					.insertContentAt(from, text, getInsertContentOptions())
					.run();
				editor.setEditable(true);

				return text;
			})
			.catch(() => {
				editor.commands.setMeta("removeDecoration", true);
				editor.setEditable(true);
			});

		return true;
	};
