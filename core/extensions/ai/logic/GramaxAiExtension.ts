import { generate, prettify, restoreSelection, saveSelection, transcribe } from "@ext/ai/logic/Commands";
import BlurSelection from "@ext/ai/logic/plugins/BlurSelection/BlurSelection";
import type {
	AiGenerateOptions,
	AiPrettifyOptions,
	AiTranscribeOptions,
	TiptapGramaxAiOptions,
} from "@ext/ai/models/types";
import { getEditorContext } from "@ext/markdown/elementsUtils/editorContext/EditorContext";
import { Extension } from "@tiptap/core";

declare module "@tiptap/core" {
	interface Storage {
		ai: { enabled?: boolean };
	}

	interface Commands<ReturnType> {
		aiPrettify: { aiPrettify: (options: AiPrettifyOptions) => ReturnType };
		aiGenerate: { aiGenerate: (options: AiGenerateOptions) => ReturnType };
		saveSelection: { saveSelection: () => ReturnType };
		restoreSelection: { restoreSelection: () => ReturnType };
		aiTranscribe: { aiTranscribe: (options: AiTranscribeOptions) => ReturnType };
	}
}

const Ai = Extension.create<TiptapGramaxAiOptions>({
	name: "GramaxAi",

	addOptions() {
		return {
			apiUrlCreator: null,
			resourceService: null,
		};
	},

	addCommands() {
		const getApiUrlCreator = () => getEditorContext(this.editor).apiUrlCreator;
		return {
			aiPrettify: (options: AiPrettifyOptions) => prettify(getApiUrlCreator())(options),
			aiGenerate: (options: AiGenerateOptions) => generate(getApiUrlCreator())(options),
			aiTranscribe: (options: AiTranscribeOptions) => transcribe(getApiUrlCreator())(options),
			saveSelection: saveSelection,
			restoreSelection: restoreSelection,
		};
	},

	addProseMirrorPlugins() {
		return [BlurSelection(this.editor)];
	},
});

export default Ai;
