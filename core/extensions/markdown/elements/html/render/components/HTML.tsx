import { ReactElement, useCallback, useEffect, useRef } from "react";

const Html = ({ content, className }: { content: string; className?: string }): ReactElement => {
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

	const renderContent = useCallback((content: string) => {
		const iframe = rootRef.current as HTMLIFrameElement;
		const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
		if (!iframeDoc) return;

		iframeDoc.open();
		iframeDoc.write(content);
		iframeDoc.close();
		resizeIframe();
	}, []);

	useEffect(() => {
		if (!ref.current) return;
		renderContent(content);
	}, [content, rootRef?.current]);

	return (
		<div ref={ref} className={`${className} focus-pointer-events`} data-focusable="true">
			<iframe
				data-hover-target="true"
				ref={rootRef}
				onLoad={resizeIframe}
				width="100%"
				frameBorder={0}
				sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals allow-pointer-lock allow-downloads allow-top-navigation allow-top-navigation-by-user-activation"
			/>
		</div>
	);
};

export default Html;
