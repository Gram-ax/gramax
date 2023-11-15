import { useEffect } from "react";

export default abstract class EventListener {
	public static add<K extends keyof DocumentEventMap>(
		type: K,
		handler: (this: Document, ev: DocumentEventMap[K]) => any,
		options?: boolean | AddEventListenerOptions,
	) {
		useEffect(() => {
			document.addEventListener(type, handler, options);
			return () => {
				document.removeEventListener(type, handler, options);
			};
		});
	}
}
