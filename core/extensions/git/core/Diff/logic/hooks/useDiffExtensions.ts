import type { ClientCatalogProps } from "@core/SitePresenter/SitePresenter";
import type ApiUrlCreator from "@core-ui/ApiServices/ApiUrlCreator";
import { useIsDoublePanel } from "@ext/git/core/Diff/components/store/DiffViewModeStore";
import OldDiffExtension, { type DiffExtensionProps } from "@ext/git/core/Diff/logic/DiffExtension";
import { getReactNodeRenderers } from "@ext/git/core/Diff/logic/getReactNodeRenderers";
import { useSetting } from "@ext/settings/logic/hooks";
import { feature } from "@ext/toggleFeatures/features";
import { DiffExtension, type DiffOptions } from "@gaurussel/tiptap-diff-utility";
import type { Editor, Extensions, JSONContent } from "@tiptap/core";
import { useCallback, useEffect, useMemo, useRef } from "react";

interface GetDiffExtensionsProps extends Partial<DiffExtensionProps> {
	oldContent: JSONContent;
	newContent: JSONContent;
	type: "new" | "old";
	oldApiUrlCreator?: ApiUrlCreator;
	oldCatalogProps?: ClientCatalogProps;
	isOldContextLoading?: boolean;
}

interface UseDiffExtensionsResult {
	extensions: Extensions;
	onEditorCreate: (editor: Editor) => void;
}

export const useDiffExtensions = ({
	oldContent,
	newContent,
	type,
	isPin,
	oldScope,
	newScope,
	articlePath,
	oldApiUrlCreator,
	oldCatalogProps,
	isOldContextLoading,
	...diffProps
}: GetDiffExtensionsProps): UseDiffExtensionsResult => {
	const oldContext = useMemo(
		() =>
			oldApiUrlCreator && oldCatalogProps
				? { apiUrlCreator: oldApiUrlCreator, catalogProps: oldCatalogProps }
				: undefined,
		[oldApiUrlCreator, oldCatalogProps],
	);
	const editorRef = useRef<Editor | null>(null);

	const [sensitivity] = useSetting("contentCompare.sensitivity");
	const [minSimilarity] = useSetting("contentCompare.minSimilarity");
	const [debounce] = useSetting("contentCompare.debounce");
	const [minMatchLength] = useSetting("contentCompare.minMatchLength");

	const newDiffsEnabled = feature("new-diffs");
	const isDoublePanel = useIsDoublePanel();

	const isOldEditor = type === "old";
	const rendersDeletions = isDoublePanel ? isOldEditor : !isOldEditor;
	const isLoading = rendersDeletions && !!isOldContextLoading;

	// biome-ignore lint/correctness/useExhaustiveDependencies: contents are read on recompute, but must not trigger one — that would reset the baseline on every edit
	const diffExtensions = useMemo(() => {
		const baseline = isOldEditor ? newContent : oldContent;
		return [
			OldDiffExtension.configure({ ...diffProps, isPin, oldScope, newScope, articlePath, isOldEditor }),
			newDiffsEnabled
				? DiffExtension.configure({
						baseline,
						sensitivity,
						minSimilarity,
						mode: isDoublePanel ? (isOldEditor ? "deletions" : "additions") : "unified",
						debounceMs: debounce,
						minMatchLength,
						react: getReactNodeRenderers({ oldContext, isLoading }),
					})
				: undefined,
		].filter(Boolean);
	}, [isOldEditor, isPin, oldScope, newScope, articlePath, newDiffsEnabled]);

	const updateSettings = useCallback(
		(settings: Partial<DiffOptions>) => {
			if (!editorRef.current || !newDiffsEnabled) return;
			editorRef.current.commands.setDiffOptions({
				...settings,
			} as DiffOptions);
		},
		[newDiffsEnabled],
	);

	const onEditorCreate = useCallback((editor: Editor) => {
		editorRef.current = editor;
	}, []);

	useEffect(() => {
		if (!editorRef.current || !newDiffsEnabled) return;
		updateSettings({
			sensitivity,
			minSimilarity,
			debounceMs: debounce,
			minMatchLength,
			react: getReactNodeRenderers({ oldContext, isLoading }),
			mode: isDoublePanel ? (isOldEditor ? "deletions" : "additions") : "unified",
		});
	}, [
		debounce,
		minMatchLength,
		minSimilarity,
		sensitivity,
		updateSettings,
		newDiffsEnabled,
		isDoublePanel,
		isOldEditor,
		oldContext,
		isLoading,
	]);

	return { extensions: diffExtensions, onEditorCreate };
};
