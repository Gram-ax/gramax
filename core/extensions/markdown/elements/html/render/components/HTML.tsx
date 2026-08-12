import { ArticleComponentResizer } from "@ext/article/Components/ArticleComponentResizer";
import { type ReactElement, useEffect, useMemo, useRef } from "react";
import { type HtmlOptions, useResolveHtmlOptions } from "../../logic/useResolveHtmlOptions";

type HtmlProps = {
	content: string;
	className?: string;
	scale?: number | string;
	isPrint?: boolean;
	/** In the editor the resizer is rendered by HTMLComponent around the whole node view. */
	inEditor?: boolean;
};

function wrapUserHtml(userHtml: string, iframeId: string, options: HtmlOptions) {
	const { theme } = options;
	return `<!doctype html><meta charset="utf-8">
<meta http-equiv="Content-Security-Policy"
      content="default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data: blob:;">
<style>html,body{margin:0;padding:0;height:auto;}</style>
${userHtml}
<script>
  document.documentElement.dataset.theme = "${theme}";
  let lastHeight = -1;
  const post = () => {
    const h = Math.ceil(document.documentElement.getBoundingClientRect().height);
    if (h === lastHeight) return;
    lastHeight = h;
    parent.postMessage({ type: "embed:height", h, iframeId: "${iframeId}" }, "*");
  };
  const observer = new ResizeObserver(post);
  observer.observe(document.documentElement);
  if (document.body) observer.observe(document.body);
  addEventListener("load", post);
</script>`;
}

const Html = ({ content, className, scale, isPrint, inEditor }: HtmlProps): ReactElement => {
	const iframeRef = useRef<HTMLIFrameElement>(null);
	const iframeId = useMemo(() => `iframe-${Math.random().toString(36).slice(2)}`, []);
	const options = useResolveHtmlOptions();
	const srcDoc = useMemo(() => wrapUserHtml(content, iframeId, options), [content, iframeId, options]);

	useEffect(() => {
		const onMessage = (e: MessageEvent) => {
			if (e.data?.type === "embed:height" && e.data?.iframeId === iframeId) {
				const height = `${e.data.h}px`;
				if (iframeRef.current.style.height === height) return;
				iframeRef.current.style.height = height;
			}
		};

		window.addEventListener("message", onMessage);
		return () => window.removeEventListener("message", onMessage);
	}, [iframeId]);

	const block = (
		<div className={`${className ?? ""} focus-pointer-events`} data-focusable="true" data-testid="html-block">
			<iframe
				data-hover-target="true"
				frameBorder={0}
				ref={iframeRef}
				referrerPolicy="no-referrer"
				sandbox="allow-scripts allow-popups"
				srcDoc={srcDoc}
				style={{ border: 0, height: 200 }}
				title="embedded-html"
				width="100%"
			/>
		</div>
	);

	if (inEditor) return block;

	return (
		<div data-component="html" data-resize-container>
			<ArticleComponentResizer defaultScale="100%" disabled isPrint={isPrint} scale={scale}>
				{block}
			</ArticleComponentResizer>
		</div>
	);
};

export default Html;
