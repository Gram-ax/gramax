import { useCallbackRef } from "@core-ui/hooks/useCallbackRef";
import { useEffect } from "react";

/**
 * https://github.com/radix-ui/primitives/blob/main/packages/react/use-escape-keydown/src/use-escape-keydown.tsx
 * Listens for when the escape key is down
 */
function useEscapeKeydown(
	onEscapeKeyDownProp?: (event: KeyboardEvent) => void,
	ownerDocument: Document = globalThis?.document,
) {
	const onEscapeKeyDown = useCallbackRef(onEscapeKeyDownProp);

	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape") {
				onEscapeKeyDown(event);
			}
		};
		ownerDocument.addEventListener("keydown", handleKeyDown, { capture: true });
		return () => ownerDocument.removeEventListener("keydown", handleKeyDown, { capture: true });
	}, [onEscapeKeyDown, ownerDocument]);
}

export { useEscapeKeydown };
