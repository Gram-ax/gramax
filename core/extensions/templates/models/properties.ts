import { PropertyTypes } from "@ext/properties/models";

export const isComplexProperty: Partial<{
	[type in PropertyTypes]: boolean;
}> = {
	[PropertyTypes.blockMd]: true,
	[PropertyTypes.inlineMd]: true,
	[PropertyTypes.array]: true,
};
