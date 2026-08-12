import { act, renderHook } from "@testing-library/react";
import type { AnimationEvent } from "react";
import { useCollapsibleAnimation } from "../useCollapsibleAnimation";

test("clips collapsible content before notifying about the open state", () => {
	const states: boolean[] = [];
	const onOpenChange = (open: boolean) => states.push(open);
	const { result } = renderHook(() => useCollapsibleAnimation(onOpenChange));

	act(() => result.current.handleOpenChange(true));

	expect(result.current.animating).toBe(true);
	expect(states).toEqual([true]);

	const parent = document.createElement("div");
	const child = document.createElement("div");
	act(() =>
		result.current.handleAnimationEnd({
			target: child,
			currentTarget: parent,
		} as unknown as AnimationEvent<HTMLElement>),
	);

	expect(result.current.animating).toBe(true);

	act(() =>
		result.current.handleAnimationEnd({
			target: parent,
			currentTarget: parent,
		} as unknown as AnimationEvent<HTMLElement>),
	);

	expect(result.current.animating).toBe(false);
});
