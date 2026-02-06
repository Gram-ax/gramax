import { ReactElement, useEffect, useMemo, useRef } from "react";
import { HtmlOptions, useResolveHtmlOptions } from "../../logic/useResolveHtmlOptions";

type HtmlProps = { content: string; className?: string };

function wrapUserHtml(userHtml: string, iframeId: string, options: HtmlOptions) {
	const { theme } = options;
	return `<!doctype html><meta charset="utf-8">
<meta http-equiv="Content-Security-Policy"
      content="default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data: blob:;">
<style>html,body{margin:0;padding:0;}</style>
${userHtml}
<script>
  document.documentElement.dataset.theme = "${theme}";
  const post = () => {
  parent.postMessage(
    { type: "embed:height", h: document.scrollingElement.scrollHeight, iframeId: "${iframeId}" },
    "*"
  )};
  new ResizeObserver(post).observe(document.body);
  addEventListener("load", post);
</script>`;
}

const Html = ({ content, className }: HtmlProps): ReactElement => {
	const iframeRef = useRef<HTMLIFrameElement>(null);
	const iframeId = useMemo(() => `iframe-${Math.random().toString(36).slice(2)}`, []);
	const options = useResolveHtmlOptions();
	const srcDoc = useMemo(() => wrapUserHtml(content, iframeId, options), [content, iframeId, options]);

	useEffect(() => {
		const onMessage = (e: MessageEvent) => {
			if (e.data?.type === "embed:height" && e.data?.iframeId === iframeId) {
				iframeRef.current.style.height = e.data.h + "px";
			}
		};

		window.addEventListener("message", onMessage);
		return () => window.removeEventListener("message", onMessage);
	}, [iframeId]);

	return (
		<div className={`${className ?? ""} focus-pointer-events`} data-focusable="true">
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
};

export default Html;
