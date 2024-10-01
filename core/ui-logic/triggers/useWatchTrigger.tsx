import useWatch from "@core-ui/hooks/useWatch";
import { Trigger } from "@core-ui/triggers/useTrigger";
import { EffectCallback } from "react";

const useWatchTrigger = (callback: EffectCallback, trigger: Trigger) => {
	useWatch(() => {
		if (trigger !== null && trigger !== undefined) callback();
	}, [trigger]);
};

export default useWatchTrigger;
