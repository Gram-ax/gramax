import { useState, useCallback } from "react";

export type Trigger = any;

const useTrigger = (): [Trigger, () => void] => {
	const [value, setValue] = useState(false);

	const emitValue = useCallback(() => {
		setValue((p) => !p);
	}, []);

	return [value, emitValue];
};

export default useTrigger;
