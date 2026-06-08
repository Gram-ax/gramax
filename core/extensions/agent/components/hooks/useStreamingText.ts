import { useEffect, useState } from "react";

type Options = {
	chunkSize?: number;
	intervalMs?: number;
};

export function useStreamingTextState(fullText: string, active: boolean, options: Options = {}) {
	const { chunkSize = 2, intervalMs = 18 } = options;
	const [visible, setVisible] = useState(() => (active ? "" : fullText));
	const [complete, setComplete] = useState(!active);

	useEffect(() => {
		if (!active) {
			setVisible(fullText);
			setComplete(true);
			return;
		}
		setComplete(false);
		setVisible("");
		let i = 0;
		const id = setInterval(() => {
			i += chunkSize;
			if (i >= fullText.length) {
				setVisible(fullText);
				setComplete(true);
				clearInterval(id);
				return;
			}
			setVisible(fullText.slice(0, i));
		}, intervalMs);
		return () => clearInterval(id);
	}, [active, fullText, chunkSize, intervalMs]);

	return { visibleText: visible, isComplete: complete };
}
