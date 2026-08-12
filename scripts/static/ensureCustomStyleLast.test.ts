import { readFileSync } from "fs";
import { join } from "path";
import { runInNewContext } from "vm";

const script = readFileSync(join(process.cwd(), "scripts/static/ensureCustomStyleLast.js"), "utf8");

test("keeps copied custom CSS last after a later style is added", () => {
	const runtimeStyle = document.createElement("style");
	runtimeStyle.id = "dynamic-styles";
	document.head.appendChild(runtimeStyle);

	const link = document.createElement("link");
	link.id = "custom-style-link";
	document.head.appendChild(link);

	const sheet = {
		ownerNode: link,
		cssRules: [{ cssText: "body { color: red; }" }],
	};
	Object.defineProperty(link, "sheet", { configurable: true, value: sheet });
	Object.defineProperty(document, "styleSheets", { configurable: true, value: [sheet] });

	let onMutation: MutationCallback | undefined;
	const observer = {
		disconnect: jest.fn(() => {
			onMutation = undefined;
		}),
		observe: jest.fn(),
	};
	const MutationObserver = jest.fn((callback: MutationCallback) => {
		observer.observe.mockImplementation(() => {
			onMutation = callback;
		});
		return observer;
	});
	runInNewContext(script, { MutationObserver, document, setTimeout: jest.fn() });

	const appendChild = document.head.appendChild.bind(document.head);
	const appendChildSpy = jest.spyOn(document.head, "appendChild").mockImplementation((node) => {
		const result = appendChild(node);
		onMutation?.([], observer as unknown as MutationObserver);
		return result;
	});
	document.head.appendChild(document.createElement("style"));
	appendChildSpy.mockRestore();

	expect(document.head.lastElementChild?.textContent).toBe("body { color: red; }");
	expect(MutationObserver).toHaveBeenCalledTimes(1);
	expect(observer.disconnect).toHaveBeenCalledTimes(1);
	expect(observer.observe).toHaveBeenCalledTimes(2);
});
