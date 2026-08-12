import type {
	OpenApiDiagnostic,
	OpenApiDocElement,
	OpenApiErrorEvent,
	OpenApiMessages,
	OpenApiSpec,
} from "@gramax/openapi-viewer";
import { defineOpenApiElements } from "@gramax/openapi-viewer";
import "@gramax/openapi-viewer/style.css";
// Gramax's own token bridge. Loaded after the package's stylesheet so its overrides win, and from here
// rather than core/styles/main.css so nothing outside this extension has to know the viewer exists.
import "@ext/markdown/elements/openApi/render/openapi-viewer-theme.css";
import renderOpenApiCode from "@ext/markdown/elements/openApi/render/openApiCode";
import renderOpenApiMarkdown from "@ext/markdown/elements/openApi/render/openApiMarkdown";
import { useEffect, useRef } from "react";

interface OpenApiViewerProps {
	spec: OpenApiSpec;
	hideInfo?: boolean;
	hideSchemas?: boolean;
	isPrint?: boolean;
	messages?: Partial<OpenApiMessages>;
	showDiagnostics?: boolean;
	showErrorShell?: boolean;
	onError?: (error: Error, phase: string, diagnostics: OpenApiDiagnostic[]) => void;
	onRendered?: (diagnostics: OpenApiDiagnostic[]) => void;
}

/**
 * React wrapper around the <openapi-doc> custom element. This whole module (and the package it imports)
 * is loaded lazily from render/OpenApi.tsx, so its weight never lands in the main app bundle.
 */
const OpenApiViewer = ({
	spec,
	hideInfo,
	hideSchemas,
	isPrint,
	messages,
	showDiagnostics = true,
	showErrorShell = true,
	onError,
	onRendered,
}: OpenApiViewerProps) => {
	const containerRef = useRef<HTMLDivElement>(null);
	const docRef = useRef<OpenApiDocElement>(null);
	// The mount effect below creates the custom element exactly once ([] deps) and attaches its listeners
	// then -- callbacks read through these refs so a caller with an unstable onError/onRendered (e.g. the
	// spec editor preview, which rebuilds its callback on every keystroke) never fires a stale closure.
	const onErrorRef = useRef(onError);
	onErrorRef.current = onError;
	const onRenderedRef = useRef(onRendered);
	onRenderedRef.current = onRendered;

	// biome-ignore lint/correctness/useExhaustiveDependencies(messages): read once at mount, matching every other localized component (t() is a plain read, not reactive) — the element itself must also only be created once
	// biome-ignore lint/correctness/useExhaustiveDependencies(showDiagnostics): initial value only, kept in sync by the dedicated effect below
	// biome-ignore lint/correctness/useExhaustiveDependencies(showErrorShell): initial value only, kept in sync by the dedicated effect below
	// biome-ignore lint/correctness/useExhaustiveDependencies(isPrint): a print view is mounted for printing and never toggles back
	useEffect(() => {
		defineOpenApiElements({
			messages,
			renderMarkdown: renderOpenApiMarkdown,
			renderCode: renderOpenApiCode,
		});
		const el = document.createElement("openapi-doc") as OpenApiDocElement;
		el.showDiagnostics = showDiagnostics;
		el.showErrorShell = showErrorShell;
		// The element ships its own `beforeprint`/`afterprint` handling: it drops the interactive Try it state
		// -- fields, run button, result, and the authorization token with them -- and expands every disclosure,
		// re-rendering itself. The first half is what keeps a secret off paper and must never be given up. The
		// second half is what the PDF export cannot survive: the export measures each node and lifts it into a
		// fixed page box, `beforeprint` fires after that layout is frozen, and a block that grows there no
		// longer matches the box it was placed in.
		//
		// Only the export's own copy is silenced, then, and only it. `isPrint` is set by Renderer for the tree
		// rendered into the export and never for the article the reader has open, so the reader's copy keeps
		// its handler -- which is the single thing that strips the token when someone hits Ctrl+P. Shadowing
		// the method on the instance is what disables it: the element's own listeners call `this.setPrintMode`,
		// so an own-property no-op neutralizes them and the imperative path at once, without a package release.
		// Inside the export the state is stripped anyway: the operation bodies are taken out of the flow by the
		// print stylesheet, and the export renders a fresh copy that was never in Try it mode to begin with.
		if (isPrint) el.setPrintMode = () => {};
		const handleError = (event: Event) => {
			const { error, phase } = (event as OpenApiErrorEvent).detail;
			onErrorRef.current?.(error, phase, el.diagnostics);
		};
		const handleUpdated = () => {
			if (el.model && !el.model.validationErrors.length) onRenderedRef.current?.(el.diagnostics);
		};
		el.addEventListener("openapi-error", handleError);
		el.addEventListener("openapi-updated", handleUpdated);
		docRef.current = el;
		containerRef.current?.appendChild(el);
		return () => {
			el.removeEventListener("openapi-error", handleError);
			el.removeEventListener("openapi-updated", handleUpdated);
			el.remove();
			docRef.current = null;
		};
	}, []);

	useEffect(() => {
		if (!docRef.current) return;
		docRef.current.showDiagnostics = showDiagnostics;
		docRef.current.showErrorShell = showErrorShell;
		docRef.current.render();
	}, [showDiagnostics, showErrorShell]);

	// Both display-only effects run before the spec effect below (declaration order), so their initial values are
	// set before the first document render. Later toggles re-render in place without going through the spec setter,
	// which unconditionally resets server/serverVariables and would otherwise wipe reader input.
	useEffect(() => {
		if (!docRef.current) return;
		docRef.current.hideInfo = !!hideInfo;
		docRef.current.render();
	}, [hideInfo]);

	useEffect(() => {
		if (!docRef.current) return;
		docRef.current.hideSchemas = !!hideSchemas;
		docRef.current.render();
	}, [hideSchemas]);

	useEffect(() => {
		if (!docRef.current) return;
		docRef.current.spec = spec;
	}, [spec]);

	return <div data-testid="open-api-viewer" ref={containerRef} />;
};

export default OpenApiViewer;
