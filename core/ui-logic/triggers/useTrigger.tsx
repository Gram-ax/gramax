import { useState } from "react";

export type Trigger = any;

const useTrigger = (): [Trigger, () => void] => {
	const [trigger, setTrigger] = useState<number>(null);
	return [trigger, () => setTrigger((prev) => prev + 1)];
};

export default useTrigger;
