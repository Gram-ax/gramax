import { generate, prettify, saveSelection, restoreSelection } from "@ext/ai/logic/Commands";
import BlurSelection from "@ext/ai/logic/plugins/BlurSelection/BlurSelection";
import { AiGenerateOptions, AiPrettifyOptions, TiptapGramaxAiOptions } from "@ext/ai/models/types";
import { Extension } from "@tiptap/core";

declare module "@tiptap/core" {
	interface Commands<ReturnType> {
		aiPrettify: { aiPrettify: (options: AiPrettifyOptions) => ReturnType };
		aiGenerate: { aiGenerate: (options: AiGenerateOptions) => ReturnType };
		saveSelection: { saveSelection: () => ReturnType };
		restoreSelection: { restoreSelection: () => ReturnType };
	}
}

const Ai = Extension.create<TiptapGramaxAiOptions>({
	name: "GramaxAi",

	addOptions() {
		return {
			apiUrlCreator: null,
		};
	},

	addCommands() {
		return {
			aiPrettify: prettify(this.options.apiUrlCreator),
			aiGenerate: generate(this.options.apiUrlCreator),
			saveSelection: saveSelection,
			restoreSelection: restoreSelection,
		};
	},

	addProseMirrorPlugins() {
		return [BlurSelection];
	},
});

export default Ai;
