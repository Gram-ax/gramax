import { Trigger } from "@core-ui/triggers/useTrigger";
import { EffectCallback, useEffect } from "react";

const useTriggerEffect = (callback: EffectCallback, trigger: Trigger) => {
	useEffect(() => {
		if (trigger !== null && trigger !== undefined) return callback();
	}, [trigger]);
};

export default useTriggerEffect;
