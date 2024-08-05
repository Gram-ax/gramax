import { MergeConflictParser } from "@ext/git/actions/MergeConflictHandler/Monaco/logic/mergeConflictParser";
import { IDocumentMergeConflictDescriptor } from "@ext/git/actions/MergeConflictHandler/Monaco/model/interfaces";
import Theme from "@ext/Theme/Theme";
import { editor } from "monaco-editor";
import type * as monaco from "monaco-editor/esm/vs/editor/editor.api";

interface CodeLenseCommandProps {
	descriptorIdx: number;
	type: "current" | "incoming" | "both";
}

export interface CodeLensText {
	acceptCurrent: string;
	currentTextAfter: string;
	acceptIncoming: string;
	incomingTextAfter: string;
	acceptBoth: string;
	mergeWithDeletionHeader: string;
	deleteFile: string;
	leaveFile: string;
	mergeWithDeletionFileContent: string;
}

export default class FileInputMergeConflict {
	private _haveConflictWithFileDelete = false;
	private _commandId: string;
	private _codeLensLineNumbers: { current: number; incoming: number }[];
	private _mergeConfilctDescriptor: IDocumentMergeConflictDescriptor[] = [];
	private _decorators: editor.IEditorDecorationsCollection[] = [];
	private _codeLensDisposables: monaco.IDisposable[] = [];
	private _mergeConflictParser: MergeConflictParser;

	constructor(
		private _editor: editor.IStandaloneCodeEditor,
		private _monaco: typeof monaco,
		private _editorLanguage: string,
		private _codeLensText: CodeLensText,
		private _theme: Theme,
	) {
		this._mergeConflictParser = new MergeConflictParser(this._monaco);
		this._commandId = this._editor.addCommand(0, this._command.bind(this), "");

		this._mergeConfilctDescriptor = this._mergeConflictParser.scanDocument(this._editor.getModel());
		this._decorators = this._getDecorators();
		this._codeLensDisposables = this._registerCodeLenses();

		this._editor.onDidChangeCursorPosition(this._onDidChangeCursorPosition.bind(this));
	}

	get haveConflictWithFileDelete() {
		return this._haveConflictWithFileDelete;
	}

	set haveConflictWithFileDelete(value: boolean) {
		this._haveConflictWithFileDelete = value;
		this.onChange();
	}

	get mergeConfilctDescriptor() {
		return this._mergeConfilctDescriptor;
	}

	get codeLensText() {
		return this._codeLensText;
	}

	set codeLensText(value: CodeLensText) {
		this._codeLensText = value;
		this.onChange();
	}

	set theme(value: Theme) {
		this._theme = value;
		this.onChange();
	}

	onChange() {
		const prevMergeConfilctDescriptor = this._mergeConfilctDescriptor;
		this._mergeConfilctDescriptor = this._mergeConflictParser.scanDocument(this._editor.getModel());

		this._decorators.forEach((d) => d.clear());
		this._decorators = this._getDecorators();

		if (prevMergeConfilctDescriptor.length === this._mergeConfilctDescriptor.length)
			this._codeLensLineNumbers = this._getCodeLensLineNumbers();
		else {
			this._codeLensDisposables.forEach((d) => d.dispose());
			this._codeLensDisposables = this._registerCodeLenses();
		}
	}

	onUnmount() {
		this._decorators.forEach((d) => d.clear());
		this._codeLensDisposables.forEach((d) => d.dispose());
	}

	private _onDidChangeCursorPosition(e: editor.ICursorPositionChangedEvent) {
		if (!this._haveConflictWithFileDelete || !this._mergeConfilctDescriptor.length)
			return this._editor.updateOptions({ readOnly: false });

		const deleteTextLineNumber = this._isCurrentDeleted(this._mergeConfilctDescriptor[0])
			? this._mergeConfilctDescriptor[0].current.decoratorContent.startLineNumber
			: this._mergeConfilctDescriptor[0].incoming.decoratorContent.startLineNumber;

		const isReadOnly = e.position.lineNumber === deleteTextLineNumber;
		this._editor.updateOptions({ readOnly: isReadOnly });
	}

	private _getDecorators(): editor.IEditorDecorationsCollection[] {
		return this._mergeConfilctDescriptor.map((d) => {
			const { isCurrentEmpty, isIncomingEmpty } = this._isConflictHaveEmpty(d);
			return this._editor.createDecorationsCollection(
				[
					{
						options: {
							isWholeLine: true,
							className: "vscode-merge-current",
							after: this._haveConflictWithFileDelete
								? undefined
								: {
										content: ` (${this._codeLensText.currentTextAfter})`,
										inlineClassName: `vscode-merge-after-text-${this._theme}`,
								  },
						},
						range: d.current.header,
					},
					isCurrentEmpty
						? null
						: {
								options: { isWholeLine: true, className: "vscode-merge-current content-opacity" },
								range: d.current.decoratorContent,
						  },

					...d.commonAncestors.flatMap((a) => [
						{
							options: { isWholeLine: true, className: "vscode-merge-common-base" },
							range: a.header,
						},
						{
							options: { isWholeLine: true, className: "vscode-merge-common-base content-opacity" },
							range: a.decoratorContent,
						},
					]),
					isIncomingEmpty
						? null
						: {
								options: { isWholeLine: true, className: "vscode-merge-incoming content-opacity" },
								range: d.incoming.decoratorContent,
						  },
					{
						options: {
							isWholeLine: true,
							className: "vscode-merge-incoming",

							after: this._haveConflictWithFileDelete
								? undefined
								: {
										content: ` (${this._codeLensText.incomingTextAfter})`,
										inlineClassName: `vscode-merge-after-text-${this._theme}`,
								  },
						},
						range: d.incoming.header,
					},
				].filter(Boolean),
			);
		});
	}

	private _getCodeLensLineNumbers(): typeof this._codeLensLineNumbers {
		return this._mergeConfilctDescriptor.map((x) => ({
			current: x.current.header.startLineNumber,
			incoming: this._haveConflictWithFileDelete
				? x.incoming.decoratorContent.startLineNumber
				: x.current.header.startLineNumber,
		}));
	}

	private _registerCodeLenses(): monaco.IDisposable[] {
		if (this._mergeConfilctDescriptor.length === 0) {
			this._monaco.languages.registerCodeLensProvider(this._editorLanguage, {
				provideCodeLenses: () => ({ lenses: [], dispose: () => {} }),
				resolveCodeLens: function (_, x) {
					return x;
				},
			});
			return [];
		}

		this._codeLensLineNumbers = this._getCodeLensLineNumbers();
		return this._mergeConfilctDescriptor.map((_, idx) => {
			return this._monaco.languages.registerCodeLensProvider(this._editorLanguage, {
				provideCodeLenses: () => {
					const codeLensLine = this._codeLensLineNumbers[idx];
					return this._haveConflictWithFileDelete
						? this._getDeletionCodeLenses(this._mergeConfilctDescriptor[idx], codeLensLine, idx)
						: this._getDefaultCodeLenses(codeLensLine, idx);
				},
				resolveCodeLens: function (_, x) {
					return x;
				},
			});
		});
	}

	private _isCurrentDeleted(mergeConflictDescriptor: IDocumentMergeConflictDescriptor): boolean {
		return this._editor.getModel().getValueInRange(mergeConflictDescriptor.current.decoratorContent) === "";
	}

	private _isConflictHaveEmpty = (conflict: IDocumentMergeConflictDescriptor) => {
		const isCurrentEmpty = conflict.current.decoratorContent.startLineNumber === conflict.splitter.startLineNumber;
		const isIncomingEmpty =
			conflict.incoming.decoratorContent.startLineNumber === conflict.incoming.header.startLineNumber;
		return { isCurrentEmpty, isIncomingEmpty };
	};

	private _getDefaultCodeLenses(
		codeLensLine: {
			current: number;
			incoming: number;
		},
		idx: number,
	): monaco.languages.ProviderResult<monaco.languages.CodeLensList> {
		return {
			lenses: [
				{
					range: {
						startLineNumber: codeLensLine.current,
						startColumn: 1,
						endLineNumber: codeLensLine.current,
						endColumn: 1,
					},
					command: {
						id: this._commandId,
						title: this._codeLensText.acceptCurrent,
						arguments: [
							{
								descriptorIdx: idx,
								type: "current",
							} as CodeLenseCommandProps,
						],
					},
				},
				{
					range: {
						startLineNumber: codeLensLine.incoming,
						startColumn: 1,
						endLineNumber: codeLensLine.incoming,
						endColumn: 1,
					},
					command: {
						id: this._commandId,
						title: this._codeLensText.acceptIncoming,
						arguments: [
							{
								descriptorIdx: idx,
								type: "incoming",
							} as CodeLenseCommandProps,
						],
					},
				},
				{
					range: {
						startLineNumber: codeLensLine.incoming,
						startColumn: 1,
						endLineNumber: codeLensLine.incoming,
						endColumn: 1,
					},
					command: {
						id: this._commandId,
						title: this._codeLensText.acceptBoth,
						arguments: [
							{
								descriptorIdx: idx,
								type: "both",
							} as CodeLenseCommandProps,
						],
					},
				},
			],
			dispose: () => {},
		};
	}

	private _getDeletionCodeLenses(
		mergeConflictDescriptor: IDocumentMergeConflictDescriptor,
		codeLensLine: { current: number; incoming: number },
		idx: number,
	): monaco.languages.ProviderResult<monaco.languages.CodeLensList> {
		const isCurrentDeleted = this._isCurrentDeleted(mergeConflictDescriptor);
		return {
			lenses: [
				{
					range: {
						startLineNumber: codeLensLine.current,
						startColumn: 1,
						endLineNumber: codeLensLine.current,
						endColumn: 1,
					},
					command: {
						id: null,
						title: this._codeLensText.mergeWithDeletionHeader,
					},
				},
				{
					range: {
						startLineNumber: codeLensLine.current,
						startColumn: 1,
						endLineNumber: codeLensLine.current,
						endColumn: 1,
					},
					command: {
						id: this._commandId,
						title: this._codeLensText.deleteFile,
						arguments: [
							{
								descriptorIdx: idx,
								type: isCurrentDeleted ? "current" : "incoming",
							} as CodeLenseCommandProps,
						],
					},
				},
				{
					range: {
						startLineNumber: codeLensLine.current,
						startColumn: 1,
						endLineNumber: codeLensLine.current,
						endColumn: 1,
					},
					command: {
						id: this._commandId,
						title: this._codeLensText.leaveFile,
						arguments: [
							{
								descriptorIdx: idx,
								type: isCurrentDeleted ? "incoming" : "current",
							} as CodeLenseCommandProps,
						],
					},
				},
				{
					range: {
						startLineNumber: codeLensLine.incoming,
						startColumn: 1,
						endLineNumber: codeLensLine.incoming,
						endColumn: 1,
					},
					command: {
						id: null,
						title: this._codeLensText.mergeWithDeletionFileContent,
					},
				},
			],
			dispose: () => {},
		};
	}

	private _command(_: any, { descriptorIdx, type }: CodeLenseCommandProps) {
		const currentMergeConflict = this._mergeConfilctDescriptor[descriptorIdx];

		const currentText = this._editor.getModel().getValueInRange(currentMergeConflict.current.decoratorContent);
		const incomingText = this._editor.getModel().getValueInRange(currentMergeConflict.incoming.decoratorContent);
		const bothText = currentText + "\n" + incomingText;

		let contentText: string;
		if (type === "current") contentText = currentText;
		else if (type === "incoming") contentText = incomingText;
		else contentText = bothText;

		this._editor.getModel().pushEditOperations(
			null,
			[
				{
					range: currentMergeConflict.range,
					text: contentText,
					forceMoveMarkers: true,
				},
			],
			null,
		);
		this._editor.updateOptions({ readOnly: false });
	}
}
