import { isEditableProseMirrorAnchor, isTauriExternalHref } from "./useTauriExternalLinkInterceptor";

describe("isTauriExternalHref", () => {
	test("returns true for http links", () => {
		expect(isTauriExternalHref("https://360.yandex.ru/calendar/")).toBe(true);
		expect(isTauriExternalHref("http://example.com")).toBe(true);
	});

	test("returns true for external non-http protocols", () => {
		expect(isTauriExternalHref("mailto:test@example.com")).toBe(true);
		expect(isTauriExternalHref("tel:+123456789")).toBe(true);
	});

	test("returns false for internal app links", () => {
		expect(isTauriExternalHref("/docs/page")).toBe(false);
		expect(isTauriExternalHref("./page")).toBe(false);
		expect(isTauriExternalHref("../page")).toBe(false);
		expect(isTauriExternalHref("#section")).toBe(false);
		expect(isTauriExternalHref("?tab=settings")).toBe(false);
	});

	test("returns false for tauri-specific and unsafe protocols", () => {
		expect(isTauriExternalHref("gramax://open/something")).toBe(false);
		expect(isTauriExternalHref("tauri://localhost")).toBe(false);
		expect(isTauriExternalHref("blob:https://example.com/id")).toBe(false);
		expect(isTauriExternalHref("javascript:alert(1)")).toBe(false);
		expect(isTauriExternalHref("data:text/html,123")).toBe(false);
	});
});

describe("isEditableProseMirrorAnchor", () => {
	test("returns true for anchors inside editable ProseMirror", () => {
		document.body.innerHTML = `
			<div class="ProseMirror" contenteditable="true">
				<p><a href="https://gram.ax/">Gramax</a></p>
			</div>
		`;

		const anchor = document.querySelector("a");

		expect(anchor).not.toBeNull();
		expect(isEditableProseMirrorAnchor(anchor as Element)).toBe(true);
	});

	test("returns false for anchors outside editable ProseMirror", () => {
		document.body.innerHTML = `
			<div class="modal">
				<p><a href="https://gram.ax/">Gramax</a></p>
			</div>
		`;

		const anchor = document.querySelector("a");

		expect(anchor).not.toBeNull();
		expect(isEditableProseMirrorAnchor(anchor as Element)).toBe(false);
	});
});
