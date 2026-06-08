import type { Locator } from "@playwright/test";
import { editorTest } from "@web/fixtures/editor.fixture";

export interface ResizerFixture {
	resizer: Locator;
	dragResizer: (deltaX: number) => Promise<void>;
}

export const resizerTest = editorTest.extend<ResizerFixture>({
	resizer: async ({ sharedPage }, use) => {
		const resizer = sharedPage.getByTestId("component-resizer");
		await use(resizer);
	},
	dragResizer: async ({ sharedPage, resizer }, use) => {
		await use(async (deltaX: number) => {
			const box = await resizer.boundingBox();
			if (!box) return;
			const x = box.x + box.width / 2;
			const y = box.y + box.height / 2;

			await resizer.dispatchEvent("pointerdown", { clientX: x, clientY: y, pointerId: 1, bubbles: true });
			for (let i = 1; i <= 10; i++) {
				await sharedPage.evaluate(
					({ cx, cy }) => {
						document.dispatchEvent(
							new PointerEvent("pointermove", { clientX: cx, clientY: cy, bubbles: true }),
						);
					},
					{ cx: x + (deltaX * i) / 10, cy: y },
				);
			}
			await sharedPage.evaluate(
				({ cx, cy }) => {
					document.dispatchEvent(new PointerEvent("pointerup", { clientX: cx, clientY: cy, bubbles: true }));
				},
				{ cx: x + deltaX, cy: y },
			);
		});
	},
});
