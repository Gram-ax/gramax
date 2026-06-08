import type { editor, IRange } from "monaco-editor";
import type * as monacoType from "monaco-editor/esm/vs/editor/editor.api";
import { useCallback } from "react";

export interface LineRangeRestriction extends IRange {
	startLineNumber: number;
	startColumn: number;
	endLineNumber: number;
	endColumn: number;
}

const useMonacoLinesRestriction = (readOnlyRanges?: LineRangeRestriction[]) => {
	return useCallback(
		(modifiedEditor: editor.ICodeEditor, monaco: typeof monacoType) => {
			const effectiveRanges = readOnlyRanges;
			if (!effectiveRanges?.length) return;

			const model = modifiedEditor.getModel();
			if (!model) return;

			let originalContent = model.getValue();
			let isReverting = false;

			const disposable = model.onDidChangeContent((e) => {
				if (isReverting) return;

				const violatingChanges = e.changes.filter((change) =>
					effectiveRanges.some((forbidden) =>
						monaco.Range.areIntersecting(
							new monaco.Range(
								forbidden.startLineNumber,
								forbidden.startColumn,
								forbidden.endLineNumber,
								forbidden.endColumn,
							),
							change.range,
						),
					),
				);

				if (!violatingChanges.length) {
					originalContent = model.getValue();
					return;
				}

				isReverting = true;
				model.applyEdits(
					[...violatingChanges]
						.sort((a, b) => b.rangeOffset - a.rangeOffset)
						.map((change) => {
							const newLines = change.text.split("\n");
							const endLineNumber = change.range.startLineNumber + newLines.length - 1;
							const endColumn =
								newLines.length === 1
									? change.range.startColumn + change.text.length
									: newLines[newLines.length - 1].length + 1;

							return {
								range: new monaco.Range(
									change.range.startLineNumber,
									change.range.startColumn,
									endLineNumber,
									endColumn,
								),
								text: originalContent.substring(
									change.rangeOffset,
									change.rangeOffset + change.rangeLength,
								),
							};
						}),
				);
				isReverting = false;
			});

			return () => disposable.dispose();
		},
		[readOnlyRanges],
	);
};

export default useMonacoLinesRestriction;
