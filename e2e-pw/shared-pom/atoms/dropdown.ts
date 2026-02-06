import type { Locator, Page as PlaywrightPage } from "@playwright/test";
import { expect } from "@playwright/test";

export type DropdownItemDto = {
	title: string | null;
	description: string | null;
	hasSubContent: boolean;
	locator: Locator;
};

export class DropdownItem {
	constructor(private _dto: DropdownItemDto) {}

	get raw(): DropdownItemDto {
		return this._dto;
	}

	get title(): string | null {
		return this._dto.title;
	}

	get description(): string | null {
		return this._dto.description;
	}

	get hasSubContent(): boolean {
		return this._dto.hasSubContent;
	}

	async click(): Promise<void> {
		await this._dto.locator.click();
	}

	async hover(): Promise<void> {
		await this._dto.locator.hover();
	}

	async assertVisible(): Promise<void> {
		await expect(this._dto.locator, "Dropdown item should be visible").toBeVisible({ timeout: 500, visible: true });
	}

	async assertHidden(): Promise<void> {
		await expect(this._dto.locator, "Dropdown item should be hidden").toBeHidden({ timeout: 500 });
	}
}

export class Dropdown {
	private _content: Locator;
	private _item: Locator;

	constructor(
		private _page: PlaywrightPage,
		private _trigger: Locator,
		content?: Locator,
		item?: Locator,
	) {
		this._content = content ?? this._page.getByTestId("dropdown-content");
		this._item = item ?? this._page.getByTestId("dropdown-item");
	}

	async assertTriggerVisible(): Promise<void> {
		await expect(this._trigger, `${this._name()} trigger should be visible`).toBeVisible({
			timeout: 500,
			visible: true,
		});
	}

	async assertContentVisible(): Promise<void> {
		await expect(this._content, `${this._name()} content should be visible`).toBeVisible({
			timeout: 500,
			visible: true,
		});
	}

	async assertContentHidden(): Promise<void> {
		await expect(this._content, `${this._name()} content should be hidden`).toBeHidden({
			timeout: 500,
		});
	}

	async assertHasItems(items: Partial<Omit<DropdownItemDto, "locator">>[]): Promise<void> {
		const actualItems = await this.getItems();
		expect(actualItems).toHaveLength(items.length);

		for (let i = 0; i < items.length; i++) {
			expect(actualItems[i]?.raw).toMatchObject(items[i]!);
		}
	}

	async assertHasItem(item: Partial<Omit<DropdownItemDto, "locator">>): Promise<void> {
		const actualItems = await this.getItems();
		expect(actualItems.map((item) => item.raw)).toEqual(expect.arrayContaining([expect.objectContaining(item)]));
	}

	async findItemByTitle(title: string): Promise<DropdownItem> {
		const items = await this.getItems();
		const item = items.find((item) => item.title === title);
		expect(item, `Search ${this._name()} for ${title}`).toBeDefined();
		return item!;
	}

	async isOpen(): Promise<boolean> {
		return await this._content.isVisible();
	}

	async open(): Promise<void> {
		await this.assertContentHidden();
		await this.assertTriggerVisible();
		await this._trigger.click();
		await this.assertContentVisible();
	}

	async close(): Promise<void> {
		await this.assertContentVisible();
		await this._page.keyboard.press("Escape");
		await this.assertContentHidden();
	}

	async getItems(): Promise<DropdownItem[]> {
		const locators = await this._content.locator(this._item).all();

		const items = await locators.mapAsync(async (item) => {
			const innerText = await item.innerText();
			const attr = await item.getAttribute("data-testid");

			const [title, ...description] = innerText?.trim().split("\n") ?? [null, null];

			return {
				title: title || null,
				description: description?.join("\n") || null,
				hasSubContent: attr === "sub-content",
				locator: item,
			};
		});

		return items.map((item) => new DropdownItem(item));
	}

	protected _name(): string {
		return this.constructor.name;
	}
}
