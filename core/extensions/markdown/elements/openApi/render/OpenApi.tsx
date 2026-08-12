import Skeleton from "@components/Atoms/ImageSkeleton";
import SpinnerLoader from "@components/Atoms/SpinnerLoader";
import { useGetResource } from "@core-ui/ContextServices/ResourceService/hooks/useGetResource";
import ResourceService from "@core-ui/ContextServices/ResourceService/ResourceService";
import { cn } from "@core-ui/utils/cn";
import t from "@ext/localization/locale/translate";
import BlockCommentView from "@ext/markdown/elements/comment/edit/components/View/BlockCommentView";
import DiagramError from "@ext/markdown/elements/diagrams/component/DiagramError";
import { collectRefsFromJson } from "@ext/markdown/elements/openApi/edit/logic/getAllRefs";
import OpenApiRenderBoundary from "@ext/markdown/elements/openApi/render/OpenApiRenderBoundary";
import {
	classifyResourceError,
	type OpenApiUserError,
	parseOpenApiText,
	presentOpenApiError,
	reportOpenApiRenderError,
	validateOpenApiSpec,
} from "@ext/markdown/elements/openApi/render/openApiErrors";
import buildOpenApiMessages from "@ext/markdown/elements/openApi/render/openApiMessages";
import { bundleOpenApiSpec, fetchOpenApiRefFiles } from "@ext/markdown/elements/openApi/render/resolveOpenApiRefs";
import type { OpenApiDiagnostic, OpenApiSpec } from "@gramax/openapi-viewer";
import { lazy, Suspense, useCallback, useRef, useState } from "react";
import ApiUrlCreatorService from "../../../../../ui-logic/ContextServices/ApiUrlCreator";

const LazyOpenApiViewer = lazy(() => import("./OpenApiViewer"));

interface OpenApiProps {
	src?: string;
	flag?: boolean;
	showInfo?: boolean;
	commentId?: string;
	isPrint?: boolean;
	isEditing?: boolean;
	/** The spec text once it has rendered, and `null` on every failure -- otherwise the TOC keeps the one built by the last load that worked. */
	onSpecLoaded?: (spec: string | null) => void;
}

const OpenApi = (props: OpenApiProps) => {
	const { src = "", flag = true, showInfo = true, commentId, isPrint, isEditing = false, onSpecLoaded } = props;
	const [spec, setSpec] = useState<OpenApiSpec>();
	const [userError, setUserError] = useState<OpenApiUserError>();
	const [renderError, setRenderError] = useState<Error>();
	const [isLoaded, setIsLoaded] = useState(false);
	const specRef = useRef<OpenApiSpec>();
	// Loading external $refs is async and useGetResource does not serialize its calls: editing the spec in
	// the editor starts a new pass while the previous one is still waiting on the backend. Without this
	// counter the pass that finished last won, so a stale result could become the current one.
	const loadGeneration = useRef(0);
	const specTextRef = useRef("");
	const apiUrlCreator = ApiUrlCreatorService.value;
	const resourceService = ResourceService.value;
	// Every hook below must run unconditionally on every render (rules of hooks) -- this only gates the
	// JSX at the bottom and the one place a hook's own callback body needs to bail out (useGetResource).
	// `window` is undefined during SSR, where effects never run anyway; `apiUrlCreator`/`resourceService`
	// not being ready yet is the one case that could otherwise change the number of hooks between renders.
	const canRender = typeof window !== "undefined" && !!apiUrlCreator && !!resourceService;

	const reportRenderError = useCallback(
		(error: Error, phase = "render", diagnostics: OpenApiDiagnostic[] = []) => {
			setRenderError(error);
			reportOpenApiRenderError(error, phase, {
				path: src,
				spec: specRef.current,
				specText: specTextRef.current,
				diagnostics,
			});
		},
		[src],
	);

	useGetResource(
		async (buffer, resourceError) => {
			if (!canRender) return;
			const generation = ++loadGeneration.current;
			const superseded = () => generation !== loadGeneration.current;
			// Every failure has to clear the navigation: it is kept in the store by src and survives a failed
			// reload, leaving the article's table of contents pointing at operations no longer on screen.
			const failed = (issue: OpenApiUserError) => {
				setUserError(issue);
				setRenderError(undefined);
				setIsLoaded(true);
				onSpecLoaded?.(null);
			};
			try {
				const resourceIssue = classifyResourceError(resourceError, buffer, src);
				if (resourceIssue) {
					failed(resourceIssue);
					return;
				}
				const text = buffer.toString();
				specTextRef.current = text;
				const parsed = parseOpenApiText(text, src);
				if (parsed.error) {
					failed(parsed.error);
					return;
				}
				const refs = collectRefsFromJson(parsed.spec);
				const resolvedSpec = refs.length
					? bundleOpenApiSpec(src, parsed.spec, await fetchOpenApiRefFiles(apiUrlCreator, src, text))
					: parsed.spec;
				if (superseded()) return;
				const structureError = validateOpenApiSpec(resolvedSpec, src);
				if (structureError) {
					failed(structureError);
					return;
				}

				specRef.current = resolvedSpec;
				setSpec(resolvedSpec);
				setUserError(undefined);
				setRenderError(undefined);
				setIsLoaded(true);
				onSpecLoaded?.(text);
			} catch (error) {
				// Adapter-core interaction (ref bundling, structure validation, a non-syntax parse failure) --
				// a renderer bug (D), not something the reader/author can fix. Never leave the block spinning.
				if (superseded()) return;
				setUserError(undefined);
				reportRenderError(error instanceof Error ? error : new Error(String(error)), "load");
				setIsLoaded(true);
				onSpecLoaded?.(null);
			}
		},
		src,
		undefined,
		undefined,
		isPrint,
	);

	if (!canRender) return null;

	const presentedError = userError && presentOpenApiError(userError);
	const errorBlock = presentedError ? (
		<DiagramError
			error={{ message: presentedError.message, stack: presentedError.details }}
			title={presentedError.title}
		/>
	) : renderError ? (
		<DiagramError
			error={{ message: t("openApi.errors.runtimeMessage") }}
			title={t("openApi.errors.runtimeTitle")}
		/>
	) : null;

	return (
		<div data-testid="open-api">
			{errorBlock ? (
				errorBlock
			) : (
				<div className="openapi-block" data-focusable="true">
					<BlockCommentView commentId={commentId}>
						<Skeleton height="8em" isLoaded={isLoaded} width="100%">
							<Suspense
								fallback={
									<div className={cn("flex", "place-content-center")}>
										<SpinnerLoader height={75} width={75} />
									</div>
								}
							>
								<OpenApiRenderBoundary onError={reportRenderError} resetKey={spec}>
									<LazyOpenApiViewer
										hideInfo={!showInfo}
										hideSchemas={!flag}
										isPrint={isPrint}
										messages={buildOpenApiMessages()}
										onError={reportRenderError}
										onRendered={() => setRenderError(undefined)}
										showDiagnostics={isEditing && !isPrint}
										showErrorShell={false}
										spec={spec ?? {}}
									/>
								</OpenApiRenderBoundary>
							</Suspense>
						</Skeleton>
					</BlockCommentView>
				</div>
			)}
		</div>
	);
};

export default OpenApi;
