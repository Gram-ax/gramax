import { GitMarkers } from "@ext/git/actions/MergeConflictHandler/Monaco/logic/mergeConflictParser";
import { IDocumentMergeConflictDescriptor } from "@ext/git/actions/MergeConflictHandler/Monaco/model/interfaces";
import { editor } from "monaco-editor";

const GIT_MARKERS_LENGTH = 7;

const reverseMergeConflict = (
	model: editor.ITextModel,
	mergeConfilctDescriptor: IDocumentMergeConflictDescriptor[],
): void => {
	mergeConfilctDescriptor.forEach((conflict) => {
		const isCurrentEmpty = conflict.current.decoratorContent.startLineNumber === conflict.splitter.startLineNumber;
		const isIncomingEmpty =
			conflict.incoming.decoratorContent.startLineNumber === conflict.incoming.header.startLineNumber;

		model.pushEditOperations(
			null,
			[
				{
					range: {
						startLineNumber: conflict.current.header.startLineNumber,
						endLineNumber: conflict.current.header.endLineNumber,
						startColumn: GIT_MARKERS_LENGTH + 2,
						endColumn: conflict.current.header.endColumn,
					},
					text: conflict.incoming.name,
					forceMoveMarkers: true,
				},
				{
					range: {
						startLineNumber: conflict.incoming.header.startLineNumber,
						endLineNumber: conflict.incoming.header.endLineNumber,
						startColumn: GIT_MARKERS_LENGTH + 2,
						endColumn: conflict.incoming.header.endColumn,
					},
					text: conflict.current.name,
					forceMoveMarkers: true,
				},
			],
			null,
		);
		if (isCurrentEmpty) {
			model.pushEditOperations(
				null,
				[
					{
						range: {
							startLineNumber: conflict.splitter.startLineNumber,
							endLineNumber: conflict.incoming.decoratorContent.endLineNumber,
							startColumn: conflict.splitter.startColumn,
							endColumn: conflict.incoming.decoratorContent.endColumn,
						},
						text:
							model.getValueInRange({
								startLineNumber: conflict.incoming.decoratorContent.startLineNumber,
								endLineNumber: conflict.incoming.decoratorContent.endLineNumber,
								startColumn: conflict.incoming.decoratorContent.startColumn,
								endColumn: conflict.incoming.decoratorContent.endColumn,
							}) +
							"\n" +
							GitMarkers.splitter,
						forceMoveMarkers: true,
					},
				],
				null,
			);
			return;
		}
		if (isIncomingEmpty) {
			model.pushEditOperations(
				null,
				[
					{
						range: {
							startLineNumber: conflict.current.decoratorContent.startLineNumber,
							endLineNumber: conflict.splitter.startLineNumber,
							startColumn: conflict.current.decoratorContent.startColumn,
							endColumn: conflict.splitter.endColumn,
						},
						text:
							GitMarkers.splitter +
							"\n" +
							model.getValueInRange({
								startLineNumber: conflict.current.decoratorContent.startLineNumber,
								endLineNumber: conflict.current.decoratorContent.endLineNumber,
								startColumn: conflict.current.decoratorContent.startColumn,
								endColumn: conflict.current.decoratorContent.endColumn,
							}),
						forceMoveMarkers: true,
					},
				],
				null,
			);
			return;
		}
		model.pushEditOperations(
			null,
			[
				{
					range: {
						startLineNumber: conflict.current.decoratorContent.startLineNumber,
						endLineNumber: conflict.current.decoratorContent.endLineNumber,
						startColumn: conflict.current.decoratorContent.startColumn,
						endColumn: conflict.current.decoratorContent.endColumn,
					},
					text: model.getValueInRange({
						startLineNumber: conflict.incoming.decoratorContent.startLineNumber,
						endLineNumber: conflict.incoming.decoratorContent.endLineNumber,
						startColumn: conflict.incoming.decoratorContent.startColumn,
						endColumn: conflict.incoming.decoratorContent.endColumn,
					}),
					forceMoveMarkers: true,
				},
				{
					range: {
						startLineNumber: conflict.incoming.decoratorContent.startLineNumber,
						endLineNumber: conflict.incoming.decoratorContent.endLineNumber,
						startColumn: conflict.incoming.decoratorContent.startColumn,
						endColumn: conflict.incoming.decoratorContent.endColumn,
					},
					text: model.getValueInRange({
						startLineNumber: conflict.current.decoratorContent.startLineNumber,
						endLineNumber: conflict.current.decoratorContent.endLineNumber,
						startColumn: conflict.current.decoratorContent.startColumn,
						endColumn: conflict.current.decoratorContent.endColumn,
					}),
					forceMoveMarkers: true,
				},
			],
			null,
		);
	});
};

export default reverseMergeConflict;
