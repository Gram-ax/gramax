import type { Virtualizer } from "@tanstack/react-virtual";
import { type MutableRefObject, useEffect, useState } from "react";

type RowWithLabel = { type: string; category?: string };

interface UseCategoryScrollSpyProps {
	containerRef: MutableRefObject<HTMLDivElement>;
	categoriesRef: MutableRefObject<HTMLDivElement>;
	virtualizer: Virtualizer<Element, Element>;
	rows: RowWithLabel[];
}

export const useCategoryScrollSpy = ({ containerRef, categoriesRef, virtualizer, rows }: UseCategoryScrollSpyProps) => {
	const [activeCategory, setActiveCategory] = useState<string>(null);

	// biome-ignore lint/correctness/useExhaustiveDependencies: expected
	useEffect(() => {
		const onScroll = () => {
			const containerEl = containerRef.current;
			if (!containerEl) return;

			const scrollTop = containerEl.scrollTop;
			const measurements = virtualizer.measurementsCache;

			let current: string = null;
			for (let i = 0; i < rows.length; i++) {
				const row = rows[i];
				if (row.type !== "label") continue;

				const measurement = measurements[i];
				if (!measurement) continue;
				if (measurement.start <= scrollTop) current = row.category;
				else break;
			}

			setActiveCategory((prev) => {
				if (prev === current) return prev;

				if (current) {
					const categoriesEl = categoriesRef.current;
					const activeEl = categoriesEl?.querySelector<HTMLElement>(`[data-category="${current}"]`);
					activeEl?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" });
				}

				return current;
			});
		};

		const scrollEl = containerRef.current as HTMLElement;
		if (!scrollEl) return;

		scrollEl.addEventListener("scroll", onScroll);
		onScroll();
		return () => scrollEl.removeEventListener("scroll", onScroll);
	}, [rows, virtualizer]);

	return { activeCategory };
};
