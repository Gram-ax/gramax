/** biome-ignore-all lint/suspicious/noExplicitAny: expected */
export default class AttributeFormatter {
	private _allowedAttributesKey: string[] = ["defs", "orderby", "groupby", "select", "display"];

	public parse(attrs: Record<string, string>) {
		return this._parse(attrs);
	}

	public stringify(attrs: Record<string, any>) {
		return this._stringify(attrs);
	}

	private _parse(attrs: Record<string, string>) {
		return Object.entries(attrs)
			.filter(([key]) => this._allowedAttributesKey.includes(key))
			.reduce(
				(result, [key, value]) => {
					if (!value) return result;
					if (key === "display") result[key] = value;
					else if (key === "defs" || key === "orderby" || value.includes("="))
						result[key] = this._parseToObject(value);
					else result[key] = this._parseToArray(value);
					return result;
				},
				{} as Record<string, any>,
			);
	}

	private _stringify(attrs: Record<string, any>): { [key: string]: string } {
		return Object.entries(attrs)
			.filter(([key]) => this._allowedAttributesKey.includes(key))
			.reduce(
				(result, [key, value]) => {
					if (!value) return result;
					const stringValue = String(value);
					const notObject = !stringValue.includes("[object");

					if (notObject && Array.isArray(value)) result[key] = this._stringifyArray(value);
					else if (typeof value === "string" && notObject) result[key] = value.toString();
					else result[key] = this._stringifyObject(value);
					return result;
				},
				{} as Record<string, any>,
			);
	}

	private _parseToArray(value: string) {
		return value ? value.split(",").map((item) => item.trim()) : [];
	}

	private _parseToObject(value: string) {
		return value.split(",").map((def) => {
			const [defKey, defValue] = def.split("=");
			return {
				id: defKey.trim(),
				value: defValue
					? defValue
							.trim()
							.split("&")
							.map((v) => v.trim())
					: undefined,
			};
		});
	}

	private _stringifyObject(attrs: Record<string, any>): string {
		return attrs
			.map((item: { id?: string; name?: string; value?: string[] }) => {
				const key = item.id ?? item.name;
				return !item?.value?.length ? (key ?? item) : `${key}=${item.value.join("&")}`;
			})
			.join(",");
	}

	private _stringifyArray(attrs: Record<string, any>): string {
		return attrs?.join(",");
	}
}
