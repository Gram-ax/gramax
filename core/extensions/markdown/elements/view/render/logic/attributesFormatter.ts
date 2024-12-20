export default class AttributeFormatter {
	public parse(attrs: Record<string, string>) {
		return this._parse(attrs);
	}

	public stringify(attrs: Record<string, any>) {
		return this._stringify(attrs);
	}

	private _parse(attrs: Record<string, string>) {
		return Object.entries(attrs).reduce((result, [key, value]) => {
			if (!value) return result;
			if (key === "display") result[key] = value;
			else if (value.includes("=")) result[key] = this._parseToObject(value);
			else result[key] = this._parseToArray(value);
			return result;
		}, {} as Record<string, any>);
	}

	private _stringify(attrs: Record<string, any>): { [key: string]: string } {
		return Object.entries(attrs).reduce((result, [key, value]) => {
			if (!value) return result;
			const stringValue = String(value);
			const notObject = !stringValue.includes("[object");

			if (notObject && Array.isArray(value)) result[key] = this._stringifyArray(value);
			else if (typeof value === "string" && notObject) result[key] = value.toString();
			else result[key] = this._stringifyObject(value);
			return result;
		}, {} as Record<string, any>);
	}

	private _parseToArray(value: string) {
		return value ? value.split(",").map((item) => item.trim()) : [];
	}

	private _parseToObject(value: string) {
		return value.split(",").map((def) => {
			const [defKey, defValue] = def.split("=");
			return {
				name: defKey.trim(),
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
			.map((item: { name: string; value?: string[] }) => {
				return item?.value === undefined ? item.name ?? item : `${item.name}=${item.value.join("&")}`;
			})
			.join(",");
	}

	private _stringifyArray(attrs: Record<string, any>): string {
		return attrs?.join(",");
	}
}
