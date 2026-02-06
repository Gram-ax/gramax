export class LevenshteinStrings {
	constructor(
		private oldStrings: string[],
		private newStrings: string[],
	) {}

	public getDiff(): { addedIndices: number[]; removedIndices: number[] } {
		const m = this.oldStrings.length;
		const n = this.newStrings.length;

		const dp: number[][] = Array(m + 1)
			.fill(0)
			.map(() => Array(n + 1).fill(0));

		for (let i = 0; i <= m; i++) {
			dp[i][0] = i;
		}
		for (let j = 0; j <= n; j++) {
			dp[0][j] = j;
		}

		for (let i = 1; i <= m; i++) {
			for (let j = 1; j <= n; j++) {
				if (this.oldStrings[i - 1] === this.newStrings[j - 1]) {
					dp[i][j] = dp[i - 1][j - 1];
				} else {
					dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + 1);
				}
			}
		}

		const addedIndices: number[] = [];
		const removedIndices: number[] = [];
		let i = m;
		let j = n;

		while (i > 0 || j > 0) {
			if (i > 0 && j > 0 && this.oldStrings[i - 1] === this.newStrings[j - 1]) {
				i--;
				j--;
			} else if (j > 0 && (i === 0 || dp[i][j - 1] <= dp[i - 1][j])) {
				addedIndices.unshift(j - 1);
				j--;
			} else if (i > 0 && (j === 0 || dp[i - 1][j] <= dp[i][j - 1])) {
				removedIndices.unshift(i - 1);
				i--;
			}
		}

		return { addedIndices, removedIndices };
	}
}
