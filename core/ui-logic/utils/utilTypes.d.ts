export type Equal<A, B, True, False> =
	(<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? True : False;

export type FilterNever<T> = {
	[K in keyof T as T[K] extends never ? never : K]: T[K];
};
