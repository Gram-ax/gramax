import { CustomAttributeTypeInterface, ValidationError } from "../types";

export class Class implements CustomAttributeTypeInterface {
	validate(value: any): ValidationError[] {
		if (typeof value === "string" || typeof value === "object") return [];

		return [
			{
				id: "attribute-type-invalid",
				level: "error",
				message: `Attribute 'class' must be type 'string | object'`,
			},
		];
	}

	transform(value: any) {
		if (!value || typeof value === "string") return value;

		const classes = [];
		for (const [k, v] of Object.entries(value ?? {})) if (v) classes.push(k);
		return classes.join(" ");
	}
}
