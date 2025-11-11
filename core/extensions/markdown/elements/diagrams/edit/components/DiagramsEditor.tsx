import FileInput from "@components/Atoms/FileInput/FileInput";
import SpinnerLoader from "@components/Atoms/SpinnerLoader";
import { classNames } from "@components/libs/classNames";
import FetchService from "@core-ui/ApiServices/FetchService";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import IsMobileService from "@core-ui/ContextServices/isMobileService";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import { useDebounce } from "@core-ui/hooks/useDebounce";
import useWatch from "@core-ui/hooks/useWatch";
import DiagramType from "@core/components/Diagram/DiagramType";
import styled from "@emotion/styled";
import t from "@ext/localization/locale/translate";
import ResourceService from "@ext/markdown/elements/copyArticles/resourceService";
import DiagramError from "@ext/markdown/elements/diagrams/component/DiagramError";
import DiagramRender from "@ext/markdown/elements/diagrams/component/DiagramRender";
import getMermaidDiagram from "@ext/markdown/elements/diagrams/diagrams/mermaid/getMermaidDiagram";
import getPlantUmlDiagram from "@ext/markdown/elements/diagrams/diagrams/plantUml/getPlantUmlDiagram";
import getNaturalSize from "@ext/markdown/elements/diagrams/logic/getNaturalSize";
import { Editor } from "@tiptap/core";
import { FC, Suspense, lazy, memo, useCallback, useEffect, useRef, useState } from "react";
import { FormFooter, FormHeader } from "@ui-kit/Form";
import { Modal, ModalBody, ModalContent, ModalTrigger } from "@ui-kit/Modal";
import { Button } from "@ui-kit/Button";
import UnsavedChangesModal from "@components/UnsavedChangesModal";

const LazySwaggerUI = lazy(() => import("@ext/markdown/elements/openApi/render/SwaggerUI"));

const langs: { [type in DiagramType]: string } = {
	Mermaid: "mermaid",
	"Ts-diagram": "typescript",
	"C4-diagram": "c4-model",
	"Plant-uml": "plant-uml",
};

type DiagramNames = "OpenApi" | DiagramType;

interface DiagramsEditorProps {
	editor: Editor;
	diagramName: DiagramNames;
	src?: string;
	content?: string;
	trigger?: JSX.Element;
	onClose?: () => void;
	className?: string;
}

const DIAGRAM_FUNCTIONS = {
	[DiagramType.mermaid]: getMermaidDiagram,
	[DiagramType["plant-uml"]]: getPlantUmlDiagram,
};

interface OverloadRendererProps {
	content: string;
	diagramName: DiagramType;
	setError: (value: boolean) => void;
	error: boolean | null;
	title?: string;
}

const DiagramsEditor = (props: DiagramsEditorProps) => {
	const { src, content, diagramName, editor, trigger, className, onClose } = props;
	const [isOpen, setIsOpen] = useState(!trigger);
	const [startContent, setStartContent] = useState(content ?? "");
	const [contentState, setContentState] = useState(content ?? "");
	const [contentEditState, setContentEditState] = useState(content ?? "");
	const apiUrlCreator = ApiUrlCreatorService.value;
	const { getBuffer, setResource } = ResourceService.value;
	const [error, setError] = useState(null);
	const alertWrapperRef = useRef<HTMLDivElement>(null);
	const rightItemRef = useRef<HTMLDivElement>(null);
	const [alertHeight, setAlertHeight] = useState(undefined);
	const [monacoHeight, setMonacoHeight] = useState(undefined);
	const isMobile = IsMobileService.value;
	const [pendedData, setPendedData] = useState(content ?? "");
	const diagramsServiceUrl = PageDataContextService.value.conf.diagramsServiceUrl;

	const [showWarning, setShowWarning] = useState(false);

	const saveSrc = (newContent = "") => {
		if (!src) return;
		setResource(src, newContent, undefined, true);
	};

	const saveContent = (newContent = "") => {
		if (!content) return;
		editor.commands.updateAttributes("diagrams", { content: newContent });
	};

	const getAnyDiagrams = async (content: string, isC4Diagram: boolean) => {
		const res = await FetchService.fetch(apiUrlCreator.getDiagramByContentUrl(diagramName as DiagramType), content);
		if (!res.ok) return setError(await res.json());
		return isC4Diagram ? await res.json() : await res.text();
	};

	const save = async () => {
		if (src) saveSrc(contentEditState);
		else saveContent(contentEditState);
		setContentState(contentEditState);
		setStartContent(contentEditState);
		onClose?.();
		setIsOpen(false);

		if (diagramName === "OpenApi") return;
		const diagramData = DIAGRAM_FUNCTIONS?.[diagramName]
			? await DIAGRAM_FUNCTIONS?.[diagramName](contentEditState, diagramsServiceUrl)
			: await getAnyDiagrams(contentEditState, diagramName === DiagramType["c4-diagram"]);
		const newSize = getNaturalSize(diagramData);
		if (newSize) {
			editor.commands.updateAttributes("diagrams", {
				width: newSize.width + "px",
				height: newSize.height + "px",
			});
		}
	};

	const tryCancel = () => {
		const haveChanges = contentEditState !== startContent;
		if (haveChanges) return setShowWarning(true);
		cancel();
	};

	const cancel = () => {
		setContentEditState(startContent);
		setContentState(startContent);
		onClose?.();
		setIsOpen(false);
	};

	const loadContent = (src: string) => {
		if (!src) return;
		const buffer = getBuffer(src);
		if (!buffer) return;

		const cnt = buffer.toString();
		setContentState(cnt);
		setStartContent(cnt);
		setContentEditState(cnt);
		setPendedData(cnt);
	};

	const calculateHeights = useCallback(() => {
		const alertWrapper = alertWrapperRef.current;
		const rightItem = rightItemRef.current;
		const divHeight = alertWrapper ? Math.ceil(alertWrapper.clientHeight) : 0;

		if (rightItem) {
			const rightItemHeight = rightItem.clientHeight;
			if (rightItemHeight !== 0) return setMonacoHeight(rightItemHeight - divHeight - 16);
			setMonacoHeight(undefined);
		}
		setAlertHeight(divHeight);
	}, []);

	const { start: broadcastData } = useDebounce(() => {
		setPendedData(contentEditState);
	}, 1000);

	useWatch(() => {
		if (diagramName !== DiagramType["plant-uml"]) return setPendedData(contentEditState);
		broadcastData();
	}, [contentEditState]);

	const debounceSetHeight = useCallback(() => {
		setTimeout(calculateHeights, 0);
	}, [calculateHeights]);

	const { start } = useDebounce(debounceSetHeight, 40);

	useEffect(() => {
		calculateHeights();
	}, [calculateHeights, error]);

	useEffect(() => {
		if (content) setContentState(content);
	}, [content]);

	useEffect(() => {
		loadContent(src);
	}, [src]);

	useEffect(() => {
		window.addEventListener("resize", start);
		return () => window.removeEventListener("resize", start);
	}, [start]);

	const onOpenChange = (open: boolean) => {
		if (open) {
			setIsOpen(open);
			void loadContent(src);
		} else void tryCancel();
	};

	return (
		<>
			<Modal open={isOpen} onOpenChange={onOpenChange}>
				<ModalTrigger asChild>{trigger}</ModalTrigger>
				<ModalContent data-modal-root data-diagram-editor-modal size="L" className="h-full">
					<FormHeader icon="pen" title={t("edit-diagram")} description={t("edit-diagram-description")} />
					<ModalBody className="h-full overflow-hidden">
						<div className={className}>
							<div className={classNames("window", { isMobile })}>
								<div className={"left-item"}>
									<FileInput
										className={classNames("top", { "top-short": error })}
										language={langs[diagramName]}
										value={contentState?.toString() || ""}
										onChange={setContentEditState}
										height={monacoHeight}
										uiKitTheme
									/>
									{error && (
										<div className={"bottom"} style={{ height: alertHeight }}>
											<div ref={alertWrapperRef}>
												<DiagramError error={error} diagramName={diagramName} />
											</div>
										</div>
									)}
								</div>
								<div className={classNames("divider", { hide: isMobile })} />
								<div className={classNames("right-item", { hide: isMobile })} ref={rightItemRef}>
									<div>
										<OverloadDiagramRenderer
											setError={setError}
											error={error}
											diagramName={diagramName as DiagramType}
											content={pendedData}
										/>
									</div>
								</div>
							</div>
						</div>
					</ModalBody>
					<FormFooter primaryButton={<Button onClick={save}>{t("save")}</Button>} />
				</ModalContent>
			</Modal>
			{showWarning && (
				<UnsavedChangesModal
					isOpen={showWarning}
					onOpenChange={setShowWarning}
					onSave={save}
					onDontSave={cancel}
				/>
			)}
		</>
	);
};

const OverloadDiagramRenderer: FC<OverloadRendererProps> = memo((props) => {
	const { diagramName, error, setError, title = "", content = "" } = props;
	const diagramsServiceUrl = PageDataContextService.value.conf.diagramsServiceUrl;
	const { useGetResource } = ResourceService.value;

	const ref = useRef<HTMLDivElement | HTMLImageElement>();
	const [data, setData] = useState("");

	const className = "diagram-background-without-lightbox";

	if (!DIAGRAM_FUNCTIONS?.[diagramName]) {
		return (
			<div data-focusable="true" className={className + " article"}>
				<Suspense
					fallback={
						<div className="suspense">
							<SpinnerLoader width={75} height={75} />
						</div>
					}
				>
					<LazySwaggerUI defaultModelsExpandDepth={1} spec={content} />
				</Suspense>
			</div>
		);
	}

	useGetResource(
		async (buffer: Buffer) => {
			let err = null;
			try {
				const diagramData = await DIAGRAM_FUNCTIONS?.[diagramName](buffer.toString(), diagramsServiceUrl);
				setData(diagramData);
			} catch (error) {
				err = error;
			}
			if (err) setError(err);
			else setError(null);
		},
		"",
		content,
	);

	return (
		<DiagramRender
			isFrozen={Boolean(error)}
			ref={ref}
			title={title}
			className={className}
			diagramName={diagramName}
			data={data}
		/>
	);
});

export default styled(DiagramsEditor)`
	height: 100%;

	.window {
		height: 100%;
		width: 100%;
		display: grid;
		grid-template-columns: 41fr 1rem 40fr;
	}
	.isMobile {
		grid-template-columns: 1fr 0 0;
	}
	.divider {
		padding: 0;
		height: 100%;
		margin: 0 auto;
		border-left: 1px solid var(--color-edit-menu-button-active-bg-inverse);
	}
	.fullWidth {
		width: 95%;
	}
	.diagram-background-without-lightbox {
		background-color: var(--color-diagram-bg);
		border-radius: var(--radius-large);
	}

	.modal-confirm {
		z-index: var(--z-index-article-confirm-modal);
		background-color: #2929298d;
		position: absolute;
		left: 0;
		top: 0;
		width: 100vw;
		height: 100vh;
	}

	.modal-confirm-container {
		position: absolute;
		max-width: 700px;
		left: 50%;
		top: 50%;
		transform: translate(-50%, -50%);
	}

	.hide {
		display: none;
	}

	.left-item {
		max-width: 100%;
		word-wrap: break-word;
		height: 100%;
		max-height: 100%;
		overflow: hidden;
		position: relative;

		.top {
			padding: unset !important;
			margin-bottom: 1rem;
			height: 100%;
			width: 99%;
		}
		.top-short {
			overflow: hidden;
		}

		.bottom {
			width: 99% !important;
			position: absolute;
			z-index: var(--z-index-base);
			bottom: 0;
			left: 0;

			.admonition-content {
				overflow-wrap: break-word;
			}
			.alert-stack-trace {
				margin-top: 1em;
			}
			.child-wrapper {
				background-attachment: scroll;
			}
		}
	}

	.right-item {
		height: 100%;
		width: 100%;
		overflow: auto;

		.flex-box-wrapper {
			display: flex;
			height: 100%;
			width: 100%;
			overflow: inherit;
			vertical-align: middle;

			> div {
				margin: 0;
			}
		}

		.diagram-background {
			pointer-events: none;
		}

		> div {
			margin: 0;
		}
	}
	.decorationsOverviewRuler {
		opacity: 0;
	}
`;
