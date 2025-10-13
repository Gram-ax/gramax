import { ReactElement, useEffect, useMemo, useRef } from "react";

type HtmlProps = { content: string; className?: string };

function wrapUserHtml(userHtml: string, iframeId: string) {
	return `<!doctype html><meta charset="utf-8">
<meta http-equiv="Content-Security-Policy"
      content="default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data: blob:;">
<style>html,body{margin:0;padding:0;}</style>
${userHtml}
<script>
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
	const srcDoc = useMemo(() => wrapUserHtml(content, iframeId), [content, iframeId]);

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
				ref={iframeRef}
				data-hover-target="true"
				title="embedded-html"
				sandbox="allow-scripts"
				referrerPolicy="no-referrer"
				frameBorder={0}
				width="100%"
				style={{ border: 0, height: 200 }}
				srcDoc={srcDoc}
			/>
		</div>
	);
};

export default Html;
