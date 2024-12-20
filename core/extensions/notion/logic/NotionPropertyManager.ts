import { Property, PropertyTypes, PropertyValue } from "@ext/properties/models";
import Style from "@components/HomePage/Cards/model/Style";
import {
	CollectedProperty,
	NotionProperty,
	NotionPropertyTypes as NotionTypes,
	PageNode,
} from "@ext/notion/model/NotionTypes";

export type CustomProperty = { id: string[]; originalName: string; parentTitle: string } & Property;

export class NotionPropertyManager {
	private readonly _unsupportedTypes = [NotionTypes.Files, NotionTypes.Title];
	private readonly _styles = Object.values(Style);

	private readonly _typeHandlers: Record<NotionTypes, (key: string, value: NotionProperty) => Property> = {
		[NotionTypes.Checkbox]: (key) => this._createProperty(key, PropertyTypes.flag),
		[NotionTypes.CreatedBy]: (key) => this._createProperty(key, PropertyTypes.text),
		[NotionTypes.CreatedTime]: (key) => this._createProperty(key, PropertyTypes.date),
		[NotionTypes.Date]: (key) => this._createProperty(key, PropertyTypes.date),
		[NotionTypes.Email]: (key) => this._createProperty(key, PropertyTypes.text),
		[NotionTypes.Formula]: (key) => this._createProperty(key, PropertyTypes.text),
		[NotionTypes.LastEditedBy]: (key) => this._createProperty(key, PropertyTypes.text),
		[NotionTypes.LastEditedTime]: (key) => this._createProperty(key, PropertyTypes.date),
		[NotionTypes.Number]: (key) => this._createProperty(key, PropertyTypes.numeric),
		[NotionTypes.PhoneNumber]: (key) => this._createProperty(key, PropertyTypes.text),
		[NotionTypes.RichText]: (key) => this._createProperty(key, PropertyTypes.text),
		[NotionTypes.URL]: (key) => this._createProperty(key, PropertyTypes.text),
		[NotionTypes.UniqueID]: (key) => this._createProperty(key, PropertyTypes.text),
		[NotionTypes.Relation]: (key) => this._createProperty(key, PropertyTypes.text),
		[NotionTypes.Rollup]: (key) => this._createProperty(key, PropertyTypes.text),
		[NotionTypes.MultiSelect]: (key, value) => this._createPropertyWithOptions(key, value, PropertyTypes.many),
		[NotionTypes.People]: (key, value) => this._createPropertyWithOptions(key, value, PropertyTypes.many),
		[NotionTypes.Select]: (key, value) => this._createPropertyWithOptions(key, value, PropertyTypes.enum),
		[NotionTypes.Status]: (key, value) => this._createPropertyWithOptions(key, value, PropertyTypes.enum),
		[NotionTypes.Files]: () => null,
		[NotionTypes.Title]: () => null,
	};

	private readonly _propertyTypeHandlers: Record<
		PropertyTypes,
		(value: NotionProperty, catalogProperty: Property) => PropertyValue
	> = {
		[PropertyTypes.enum]: this._processEnumProperty.bind(this),
		[PropertyTypes.many]: this._processManyProperty.bind(this),
		[PropertyTypes.date]: this._processDateProperty.bind(this),
		[PropertyTypes.numeric]: this._processNumericProperty.bind(this),
		[PropertyTypes.flag]: this._processFlagProperty.bind(this),
		[PropertyTypes.text]: this._processTextProperty.bind(this),
	};

	private _properties: CustomProperty[] = [];

	constructor(private _pageTree: PageNode[]) {
		const collectedProperties = this._gatherCatalogProperties(this._pageTree);
		const catalogProperties = this._processCatalogProperties(collectedProperties);
		this._properties.push(...catalogProperties);
	}

	get properties() {
		return this._properties;
	}

	get cleanProperties() {
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		return this._properties.map(({ id, originalName, parentTitle, ...rest }) => rest);
	}

	addCatalogProperties(): void {
		const collectedProperties = this._gatherCatalogProperties(this._pageTree);
		const catalogProperties = this._processCatalogProperties(collectedProperties);
		this._properties.push(...catalogProperties);
	}

	getArticleProperties(pageProperties: Record<string, NotionProperty>): PropertyValue[] {
		return this._processPageProperties(pageProperties);
	}

	private _gatherCatalogProperties(pageTree: PageNode[]): CollectedProperty[] {
		const collectedProperties: CollectedProperty[] = [];

		const collectProperties = (node: PageNode) => {
			if (node.type === "database") {
				for (const [key, value] of Object.entries(node.properties)) {
					collectedProperties.push({ key, value, articleTitle: node.title });
				}
			}

			if (node.children) {
				node.children.forEach(collectProperties);
			}
		};

		pageTree.forEach(collectProperties);
		return collectedProperties.reverse();
	}

	private _processCatalogProperties(allProperties: CollectedProperty[]): CustomProperty[] {
		const catalogProperties: CustomProperty[] = [];
		for (const { key, value, articleTitle } of allProperties) {
			const handler = this._typeHandlers[value.type];
			if (!handler) {
				console.warn(`Unsupported property type: ${value.type}`);
				continue;
			}

			const property = handler(key, value);
			if (!property) continue;

			const customProperty: CustomProperty = {
				id: [value.id],
				originalName: key,
				parentTitle: articleTitle,
				...property,
			};

			const exactMatch = catalogProperties.find((existingProperty) => {
				const isSameType = existingProperty.type === customProperty.type;
				const isSameValues =
					existingProperty.type === PropertyTypes.enum || existingProperty.type === PropertyTypes.many
						? JSON.stringify(existingProperty.values) === JSON.stringify(customProperty.values)
						: true;
				const isSameName = existingProperty.originalName === customProperty.name;
				return isSameValues && isSameType && isSameName;
			});

			if (exactMatch) {
				exactMatch.id.push(...customProperty.id);
				continue;
			}

			const nameMatch = catalogProperties.find(
				(existingProperty) => existingProperty.name === customProperty.name,
			);

			if (nameMatch) {
				customProperty.name = `${customProperty.parentTitle} - ${customProperty.name}`;
				nameMatch.name = `${nameMatch.parentTitle} - ${nameMatch.name}`;
			}

			catalogProperties.push(customProperty);
		}
		return catalogProperties;
	}

	private _getRandomStyle(): Style {
		return this._styles[Math.floor(Math.random() * this._styles.length)];
	}

	private _createProperty(name: string, type: PropertyTypes): Property {
		return {
			name,
			type,
			style: this._getRandomStyle(),
		};
	}

	private _createPropertyWithOptions(name: string, value: NotionProperty, type: PropertyTypes): Property {
		const property = value[value.type];
		const options = property?.options;
		const groups = property?.groups;

		const optionToGroupMap = groups?.reduce((map, group) => {
			for (const id of group.option_ids) {
				map[id] = group.name;
			}
			return map;
		}, {} as Record<string, string>);

		const values = options?.map((option) => {
			const groupName = optionToGroupMap?.[option.id];
			return groupName ? `${groupName} / ${option.name}` : option.name;
		});

		return {
			name,
			type,
			style: this._getRandomStyle(),
			...(values?.length ? { values } : {}),
		};
	}

	private _processPageProperties(pageProperties: Record<string, NotionProperty>): PropertyValue[] {
		return Object.entries(pageProperties)
			.map(([key, value]) => {
				const catalogProperty = this._findCatalogProperty(value.id);
				if (!catalogProperty) {
					if (!this._unsupportedTypes.includes(value.type)) {
						console.warn(`Property "${key}" not found in catalog properties.`);
					}
					return;
				}

				const handler = this._propertyTypeHandlers[catalogProperty.type];

				const property = handler(value, catalogProperty);
				if (!property) return;
				return { name: catalogProperty.name, value: property.value } as PropertyValue;
			})
			.filter((propertyValue): propertyValue is PropertyValue => propertyValue !== undefined);
	}

	private _findCatalogProperty = (id: string) =>
		this._properties.find((property: CustomProperty) => property.id.includes(id));

	private _processEnumProperty(value: NotionProperty, catalogProperty: Property) {
		const pageValue = value[value.type]?.name || value[value.type];
		if (!pageValue) return;
		if (value.type === NotionTypes.Status) {
			const matchedValue = catalogProperty.values?.find((val) => val.includes(pageValue));
			if (matchedValue) {
				return { name: catalogProperty.name, value: matchedValue };
			}
		}

		return { name: catalogProperty.name, value: pageValue };
	}

	private _processManyProperty(value: NotionProperty, catalogProperty: Property) {
		const pageValues = value[value.type]?.map((v) => v.name).filter(Boolean);
		if (!pageValues?.length) return;

		pageValues.forEach((val) => this._ensureValueInCatalog(val, catalogProperty));
		return { name: catalogProperty.name, value: pageValues };
	}

	private _processDateProperty(value: NotionProperty, catalogProperty: Property) {
		const dateString = value[value.type]?.start || value[value.type];
		if (!dateString) return;

		if (typeof dateString !== "string") {
			console.warn(`Invalid date value: ${dateString}`);
			return;
		}

		const dateValue = [dateString.split("T")[0]];
		return { name: catalogProperty.name, value: dateValue };
	}

	private _processNumericProperty(value: NotionProperty, catalogProperty: Property) {
		const numericValue = value[value.type];
		if (numericValue == null) return;

		return { name: catalogProperty.name, value: [numericValue] };
	}

	private _processFlagProperty(value: NotionProperty, catalogProperty: Property) {
		if (value[value.type]) {
			return { name: catalogProperty.name };
		}
	}

	private _processTextProperty(value: NotionProperty, catalogProperty: Property) {
		if (value.type === NotionTypes.Relation) {
			const textValue = this._getRelationTitles(value);
			return textValue ? { name: catalogProperty.name, value: [textValue] } : undefined;
		}

		if (value.type === NotionTypes.Rollup) {
			const rollupData = value[value.type];
			let textValue: string;

			if (rollupData.type === "array") {
				const values = rollupData[rollupData.type].map((item: any) =>
					this._propertyTypeHandlers[catalogProperty.type]?.(item, catalogProperty),
				);
				textValue = values
					.map((val: any) => val?.value?.[0])
					.filter((v) => v !== undefined)
					.join(", ");
			} else if (rollupData) {
				textValue = rollupData[rollupData.type];
			}
			return textValue ? { name: catalogProperty.name, value: [textValue] } : undefined;
		}

		if (value.type === NotionTypes.Formula) {
			const formulaType = value[value.type].type;
			const textValue = value[value.type][formulaType];
			return textValue ? { name: catalogProperty.name, value: [textValue] } : undefined;
		}

		if (value.type === NotionTypes.UniqueID) {
			const textValue = `${value[value.type].prefix} - ${value[value.type].number}`;
			return textValue ? { name: catalogProperty.name, value: [textValue] } : undefined;
		}

		const textValue = value[value.type]?.name || value[value.type]?.[0]?.plain_text || value[value.type];

		if (!textValue) return;

		return { name: catalogProperty.name, value: [textValue] };
	}

	private _ensureValueInCatalog(value: string, catalogProperty: Property): void {
		if (!catalogProperty.values) {
			catalogProperty.values = [];
		}
		if (!catalogProperty.values.includes(value)) {
			catalogProperty.values.push(value);
		}
	}

	private _getRelationTitles(value: NotionProperty): string {
		const relationIds: string[] = value?.[value.type].map((relationItem: { id: string }) => relationItem.id);

		const findPageById = (id: string, tree: PageNode[]): PageNode => {
			for (const node of tree) {
				if (node.id === id) {
					return node;
				}
				if (node.children) {
					const result = findPageById(id, node.children);
					if (result) {
						return result;
					}
				}
			}
			return null;
		};

		const titles = relationIds
			.map((id) => {
				const page = findPageById(id, this._pageTree);
				return page?.title;
			})
			.filter((title) => title !== undefined);

		return titles.join(", ");
	}
}
