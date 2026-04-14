/** biome-ignore-all lint/correctness/useExhaustiveDependencies: it's ok */
import LanguageService from "@core-ui/ContextServices/Language";
import ModalToOpenService from "@core-ui/ContextServices/ModalToOpenService/ModalToOpenService";
import ModalToOpen from "@core-ui/ContextServices/ModalToOpenService/model/ModalsToOpen";
import DiagramEditor from "@ext/markdown/elements/drawio/logic/diagram-editor";
import { useCallback, useEffect, useRef } from "react";

interface UseDrawioEditorParams {
	diagramsServiceUrl: string;
	imgRef: React.RefObject<HTMLImageElement>;
	saveCallBack: (data: string) => Promise<void>;
	setImgData: () => void;
}

const useDrawioEditor = ({ diagramsServiceUrl, imgRef, saveCallBack, setImgData }: UseDrawioEditorParams) => {
	const abortRef = useRef<AbortController>(null);

	useEffect(() => () => abortRef.current?.abort(), []);

	const openEditor = useCallback(() => {
		ModalToOpenService.setValue(ModalToOpen.Loading);
		setImgData();
		const de = DiagramEditor.editElement(
			diagramsServiceUrl,
			imgRef.current,
			saveCallBack,
			() => ModalToOpenService.resetValue(),
			null,
			"modern",
			null,
			["splash=0", `lang=${LanguageService.currentUi()}`, "pv=0"],
		);
		window.history.pushState({}, document.location.href, "");

		const abort = new AbortController();
		abortRef.current = abort;
		window.addEventListener(
			"popstate",
			() => {
				if (de.xml == null) {
					abort.abort();
					de.stopEditing();
					return;
				}

				de.hideFrame();
				let resolved = false;
				const modalId = ModalToOpenService.addModal(ModalToOpen.UnsavedChangesModal, {
					isOpen: true,
					onOpenChange: () => {
						if (resolved) return;
						ModalToOpenService.removeModal(modalId);
						queueMicrotask(() => {
							if (resolved) return;
							resolved = true;
							de.showFrame();
							window.history.pushState({}, document.location.href, "");
						});
					},
					onSave: () => {
						resolved = true;
						abort.abort();
						de.exitEditing();
					},
					onDontSave: () => {
						resolved = true;
						abort.abort();
						de.stopEditing();
					},
				});
			},
			{ signal: abort.signal },
		);
	}, [diagramsServiceUrl, imgRef.current, saveCallBack, setImgData]);

	return openEditor;
};

export default useDrawioEditor;
