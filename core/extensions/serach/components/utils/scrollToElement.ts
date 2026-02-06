import type { RefObject } from "react";

export interface CurrentScrollData {
	id?: number;
	lastTime?: number;
}

export function scrollToElement(
	container: HTMLElement,
	el: HTMLElement,
	dataRef: RefObject<CurrentScrollData | undefined>,
) {
	const cRect = container.getBoundingClientRect();
	const eRect = el.getBoundingClientRect();

	const isBelow = eRect.bottom > cRect.bottom;
	const isAbove = eRect.top < cRect.top;

	if (!isBelow && !isAbove) return;

	let targetY = container.scrollTop;

	if (isBelow) targetY += eRect.bottom - cRect.bottom;
	else if (isAbove) targetY += eRect.top - cRect.top;

	scrollTo(container, targetY, dataRef);
}

// pixel/ms
const BASE_SPEED = 0.3;
const SPEED_FACTOR = 0.008;
const MAX_SPEED = 2;

function scrollTo(container: HTMLElement, targetY: number, dataRef: RefObject<CurrentScrollData>) {
	if (dataRef.current.id !== undefined) {
		cancelAnimationFrame(dataRef.current.id);
		dataRef.current.id = undefined;
	}

	function animate(time: number) {
		if (dataRef.current.lastTime === undefined) dataRef.current.lastTime = time;

		const dt = time - dataRef.current.lastTime;
		dataRef.current.lastTime = time;

		const currentY = container.scrollTop;
		const distance = targetY - currentY;
		const direction = Math.sign(distance);

		const absDistance = Math.abs(distance);
		const newSpeed = Math.min(BASE_SPEED + absDistance * SPEED_FACTOR, MAX_SPEED);

		const step = newSpeed * dt * direction;

		if (Math.abs(step) >= absDistance) {
			container.scrollTop = targetY;
			dataRef.current.id = undefined;
			dataRef.current.lastTime = undefined;
			return;
		}

		container.scrollTop = currentY + step;
		dataRef.current.id = requestAnimationFrame(animate);
	}

	dataRef.current.id = requestAnimationFrame(animate);
}
