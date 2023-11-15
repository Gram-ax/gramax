class WordListInstancesCounter {
	private _counter = 0;

	generateInstanceNumberForList(): number {
		return this._counter++;
	}
}

export const wordListInstancesCounter = new WordListInstancesCounter();
