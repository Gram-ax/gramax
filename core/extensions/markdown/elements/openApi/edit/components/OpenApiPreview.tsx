import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import t from "@ext/localization/locale/translate";
import DiagramError from "@ext/markdown/elements/diagrams/component/DiagramError";
import { collectRefsFromJson } from "@ext/markdown/elements/openApi/edit/logic/getAllRefs";
import type { OpenApiRefFiles } from "@ext/markdown/elements/openApi/OpenApiRefFiles";
import OpenApiRenderBoundary from "@ext/markdown/elements/openApi/render/OpenApiRenderBoundary";
import {
	parseOpenApiText,
	presentOpenApiError,
	reportOpenApiRenderError,
	validateOpenApiSpec,
} from "@ext/markdown/elements/openApi/render/openApiErrors";
import buildOpenApiMessages from "@ext/markdown/elements/openApi/render/openApiMessages";
import { bundleOpenApiSpec, fetchOpenApiRefFiles } from "@ext/markdown/elements/openApi/render/resolveOpenApiRefs";
import type { OpenApiSpec } from "@gramax/openapi-viewer";
import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";

const LazyOpenApiViewer = lazy(() => import("@ext/markdown/elements/openApi/render/OpenApiViewer"));

/** Live preview of the spec being edited in the diagram editor: same viewer as the article, plus editor-only diagnostics. */
const OpenApiPreview = ({ content, src }: { content: string; src?: string }) => {
	const apiUrlCreator = ApiUrlCreatorService.value;
	const parsedResult = useMemo(() => parseOpenApiText(content, src ?? ""), [content, src]);
	// Memoized together with the parse result: on a syntax error `spec` is undefined and `?? {}` would build
	// a new object on every render. It sits in the deps of the effect below -- setSpec kept receiving a new
	// reference, React rendered again, and the loop never settled on every other keystroke.
	const parsed = useMemo(() => parsedResult.spec ?? {}, [parsedResult]);
	const refs = useMemo(() => collectRefsFromJson(parsed), [parsed]);
	const refsKey = refs.slice().sort().join("\n");

	// Persists across renders so an unrelated content edit (ref set unchanged) re-bundles from cache
	// instead of re-fetching -- only a changed ref set below triggers a new backend call.
	const filesRef = useRef<{ refsKey: string; files: OpenApiRefFiles }>({ refsKey: "", files: {} });
	const [spec, setSpec] = useState<OpenApiSpec>(parsed);
	const [renderError, setRenderError] = useState<Error>();

	// biome-ignore lint/correctness/useExhaustiveDependencies: refetches only when refsKey (the external ref set) changes; parsed re-bundles from cache on every other keystroke, content/refs.length are covered by parsed/refsKey
	useEffect(() => {
		if (!refs.length || !src || !apiUrlCreator) {
			setSpec(parsed);
			return;
		}
		if (refsKey === filesRef.current.refsKey) {
			setSpec(bundleOpenApiSpec(src, parsed, filesRef.current.files));
			return;
		}

		let cancelled = false;
		void fetchOpenApiRefFiles(apiUrlCreator, src, content).then((files) => {
			if (cancelled) return;
			filesRef.current = { refsKey, files };
			setSpec(bundleOpenApiSpec(src, parsed, files));
		});
		return () => {
			cancelled = true;
		};
	}, [parsed, refsKey, src, apiUrlCreator]);

	const userError = useMemo(
		() => parsedResult.error ?? validateOpenApiSpec(spec, src ?? ""),
		[parsedResult.error, spec, src],
	);
	const presentedError = userError && presentOpenApiError(userError);
	const reportRenderError = useCallback(
		(error: Error) => {
			setRenderError(error);
			reportOpenApiRenderError(error, "editor-preview", { path: src ?? "", spec, specText: content });
		},
		[content, spec, src],
	);

	if (presentedError)
		return (
			<DiagramError
				error={{ message: presentedError.message, stack: presentedError.details }}
				title={presentedError.title}
			/>
		);

	if (renderError)
		return (
			<DiagramError
				error={{ message: t("openApi.errors.runtimeMessage") }}
				title={t("openApi.errors.runtimeTitle")}
			/>
		);

	return (
		<OpenApiRenderBoundary onError={reportRenderError} resetKey={spec}>
			<Suspense fallback={null}>
				<LazyOpenApiViewer
					messages={buildOpenApiMessages()}
					onError={reportRenderError}
					onRendered={() => setRenderError(undefined)}
					showDiagnostics
					showErrorShell={false}
					spec={spec}
				/>
			</Suspense>
		</OpenApiRenderBoundary>
	);
};

export default OpenApiPreview;
