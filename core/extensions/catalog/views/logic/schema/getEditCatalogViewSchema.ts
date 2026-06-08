import { z } from "zod";

export type EditCatalogViewSchema = z.infer<ReturnType<typeof getEditCatalogViewSchema>>;

export const getEditCatalogViewSchema = () => {
	const propertyObjectSchema = z.object({
		id: z.string(),
		value: z.array(z.string()).optional(),
	});

	return z.object({
		name: z.string().min(1),
		filters: z.array(propertyObjectSchema),
		properties: z.array(propertyObjectSchema),
		options: z
			.object({
				docportalVisible: z.boolean().optional(),
			})
			.optional(),
	});
};
