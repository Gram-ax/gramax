import { generate, prettify, saveSelection, restoreSelection, transcribe } from "@ext/ai/logic/Commands";
import BlurSelection from "@ext/ai/logic/plugins/BlurSelection/BlurSelection";
import { AiGenerateOptions, AiPrettifyOptions, AiTranscribeOptions, TiptapGramaxAiOptions } from "@ext/ai/models/types";
import { Extension } from "@tiptap/core";

declare module "@tiptap/core" {
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
		return {
			aiPrettify: prettify(this.options.apiUrlCreator),
			aiGenerate: generate(this.options.apiUrlCreator),
			aiTranscribe: transcribe(this.options.apiUrlCreator),
			saveSelection: saveSelection,
			restoreSelection: restoreSelection,
		};
	},

	addProseMirrorPlugins() {
		return [BlurSelection(this.editor)];
	},
});

export default Ai;
