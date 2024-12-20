import { ReactElement, useCallback, useEffect, useRef } from "react";

const Html = ({ mode, content, className }: { mode: string; content: string; className?: string }): ReactElement => {
	const ref = useRef<HTMLDivElement>(null);
	const rootRef = useRef(null);

	const resizeIframe = useCallback(() => {
		const root = rootRef.current;
		if (!root.contentDocument.body) return;
		root.contentDocument.body.style.margin = "unset";
		root.contentDocument.body.style.height = "fit-content";
		root.style.height = `calc(${root.contentDocument.body.offsetHeight}px + 1.5em)`;
		const head = root.querySelector("head");

		if (head) {
			const stylesheets = head.querySelectorAll('style, link[rel="stylesheet"]');
			stylesheets.forEach(function (sheet) {
				sheet.remove();
			});
		}
	}, []);

	const renderContent = useCallback((mode: string, content: string) => {
		if (mode === "unsafe") {
			if (!rootRef.current) rootRef.current = ref.current?.attachShadow({ mode: "open" });
			const root = rootRef.current as ShadowRoot;
			if (!root) return;

			root.innerHTML = content;

			const scripts = root.querySelectorAll("script");
			scripts.forEach((script) => {
				const newScript = document.createElement("script");
				newScript.text = script.textContent || "";
				root.appendChild(newScript);
			});
		} else if (mode === "iframe") {
			const iframe = rootRef.current as HTMLIFrameElement;
			const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
			if (!iframeDoc) return;

			iframeDoc.open();
			iframeDoc.write(content);
			iframeDoc.close();
			resizeIframe();
		}
	}, []);

	useEffect(() => {
		if (!ref.current) return;
		renderContent(mode, content);
	}, [content, mode, rootRef?.current]);

	return (
		<div ref={ref} className={`${className} focus-pointer-events`} data-focusable="true">
			{mode === "iframe" && (
				<iframe
					data-hover-target="true"
					ref={rootRef}
					onLoad={resizeIframe}
					width="100%"
					frameBorder={0}
					sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals allow-pointer-lock allow-downloads allow-top-navigation allow-top-navigation-by-user-activation"
				></iframe>
			)}
		</div>
	);
};

export default Html;
