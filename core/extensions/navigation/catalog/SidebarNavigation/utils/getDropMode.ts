import { DROP_AFTER_ZONE_PX } from "./constants";
import { DropMode, type PersistedDropMode } from "./dropMode";

export const getDropMode = (
	pointerY: number,
	rect: { top: number; height: number },
	afterZonePx = DROP_AFTER_ZONE_PX,
): PersistedDropMode => {
	if (pointerY - rect.top <= afterZonePx) return DropMode.Before;
	return pointerY - rect.top >= rect.height - afterZonePx ? DropMode.After : DropMode.Into;
};
