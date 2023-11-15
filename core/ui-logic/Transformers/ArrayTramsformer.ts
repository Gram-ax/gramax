abstract class ArrayTramsformer {
	public static getDiff<T>(items_1: T[], items_2: T[], comparisonFunc: (i1: T, i2: T) => boolean): T[] {
		return [
			...items_1.filter((i1) => items_2.findIndex((i2) => comparisonFunc(i2, i1)) == -1),
			...items_2.filter((i2) => items_1.findIndex((i1) => comparisonFunc(i1, i2)) == -1),
		];
	}
}

export default ArrayTramsformer;
