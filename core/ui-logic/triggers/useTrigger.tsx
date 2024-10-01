import { useState } from "react";

export type Trigger = any;

const useTrigger = (): [Trigger, () => void] => {
	const [triggerValue, setTrigger] = useState<boolean>(null);
	return [triggerValue, () => setTrigger((prev) => !prev)];
};

export default useTrigger;
