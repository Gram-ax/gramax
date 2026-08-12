import ViewportIntersectionService from "@core-ui/ContextServices/ViewportIntersection";
import { useScrollPositionStore } from "@core-ui/stores/ScrollPositionStore";
import { act, renderHook } from "@testing-library/react";
import { createElement, createRef, type ReactNode } from "react";
import useElementInViewport from "./useElementInViewport";

type IOEntry = { isIntersecting: boolean; target: Element };
type IOCallback = (entries: IOEntry[]) => void;

class MockIntersectionObserver {
	static instances: MockIntersectionObserver[] = [];
	observed: Element[] = [];
	unobserved: Element[] = [];
	disconnected = false;
	constructor(
		public callback: IOCallback,
		public options?: IntersectionObserverInit,
	) {
		MockIntersectionObserver.instances.push(this);
	}
	observe(el: Element) {
		this.observed.push(el);
	}
	unobserve(el: Element) {
		this.unobserved.push(el);
	}
	disconnect() {
		this.disconnected = true;
	}
	fire(target: Element, isIntersecting: boolean) {
		this.callback([{ isIntersecting, target }]);
	}
}

const makeRef = () => {
	const ref = createRef<HTMLDivElement>();
	// @ts-expect-error assigning a fake element is enough for the observer to attach
	ref.current = document.createElement("div");
	return ref;
};

const withMockedIO = (fn: () => void) => {
	const original = globalThis.IntersectionObserver;
	MockIntersectionObserver.instances = [];
	// @ts-expect-error test double
	globalThis.IntersectionObserver = MockIntersectionObserver;
	try {
		fn();
	} finally {
		globalThis.IntersectionObserver = original;
	}
};

const wrapper = ({ children }: { children: ReactNode }) =>
	createElement(ViewportIntersectionService.Provider, null, children);

describe("useElementInViewport", () => {
	beforeEach(() => {
		useScrollPositionStore.getState().setRestoringScrollPosition(false);
	});

	it("is eager (true) and never observes when disabled", () => {
		withMockedIO(() => {
			const { result } = renderHook(() => useElementInViewport(makeRef(), { enabled: false }), { wrapper });
			expect(result.current).toBe(true);
			expect(MockIntersectionObserver.instances).toHaveLength(0);
		});
	});

	it("is eager (true) when IntersectionObserver is unavailable", () => {
		const original = globalThis.IntersectionObserver;
		globalThis.IntersectionObserver = undefined as unknown as typeof IntersectionObserver;
		try {
			const { result } = renderHook(() => useElementInViewport(makeRef()), { wrapper });
			expect(result.current).toBe(true);
		} finally {
			globalThis.IntersectionObserver = original;
		}
	});

	it("stays false until the element intersects, then latches true and disconnects", () => {
		withMockedIO(() => {
			const ref = makeRef();
			const { result } = renderHook(() => useElementInViewport(ref), { wrapper });
			expect(result.current).toBe(false);

			const observer = MockIntersectionObserver.instances[0];
			act(() => observer.fire(ref.current, false));
			expect(result.current).toBe(false);

			act(() => observer.fire(ref.current, true));
			expect(result.current).toBe(true);
			expect(observer.unobserved).toContain(ref.current);
		});
	});

	it("reuses one observer for multiple elements with the same root margin", () => {
		withMockedIO(() => {
			const firstRef = makeRef();
			const secondRef = makeRef();

			const { result } = renderHook(
				() => [
					useElementInViewport(firstRef, { rootMargin: "600px 0px" }),
					useElementInViewport(secondRef, { rootMargin: "600px 0px" }),
				],
				{ wrapper },
			);

			expect(result.current).toEqual([false, false]);
			expect(MockIntersectionObserver.instances).toHaveLength(1);
			expect(MockIntersectionObserver.instances[0].observed).toEqual([firstRef.current, secondRef.current]);
			expect(MockIntersectionObserver.instances[0].options).toEqual({ rootMargin: "600px 0px" });
		});
	});

	it("starts observing when enabled flips to true after mount", () => {
		withMockedIO(() => {
			const ref = makeRef();
			const { result, rerender } = renderHook(({ enabled }) => useElementInViewport(ref, { enabled }), {
				initialProps: { enabled: false },
				wrapper,
			});

			expect(result.current).toBe(true);
			expect(MockIntersectionObserver.instances).toHaveLength(0);

			rerender({ enabled: true });

			expect(result.current).toBe(false);
			expect(MockIntersectionObserver.instances).toHaveLength(1);

			act(() => MockIntersectionObserver.instances[0].fire(ref.current, true));
			expect(result.current).toBe(true);
		});
	});

	it("is eager while article scroll position is being restored", () => {
		withMockedIO(() => {
			useScrollPositionStore.getState().setRestoringScrollPosition(true);

			const { result } = renderHook(() => useElementInViewport(makeRef()), { wrapper });

			expect(result.current).toBe(true);
			expect(MockIntersectionObserver.instances).toHaveLength(0);
		});
	});
});
