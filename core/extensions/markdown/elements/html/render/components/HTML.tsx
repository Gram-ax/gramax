import { ReactElement, useEffect, useRef } from "react";

const Html = ({ content, className }: { content: string; className?: string }): ReactElement => {
	const ref = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (!ref.current) return;
		ref.current.innerHTML = content;

		const scripts = ref.current.getElementsByTagName("script");

		for (let i = 0; i < scripts.length; i++) {
			const script = document.createElement("script");
			script.text = scripts[i].text;
			scripts[i].parentNode?.replaceChild(script, scripts[i]);
		}
	}, [content]);

	return <div ref={ref} className={className} data-focusable="true"></div>;
};

export default Html;
