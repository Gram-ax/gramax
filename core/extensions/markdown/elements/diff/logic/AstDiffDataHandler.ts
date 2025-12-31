import AstDiffTransformer from "@ext/markdown/elements/diff/logic/astTransformer/AstDiffTransofrmer";
import LevenshteinStringsDiff, {
	LevenshteinStringsDiffConfig,
	LevenshteinStringsDiffResult,
} from "@ext/markdown/elements/diff/logic/levenshteinStrings/LevenshteinStringsDiff";
import PositionMapper from "@ext/markdown/elements/diff/logic/PositionMapper";

export default class AstDiffDataHandler {
	private _positionMapper: PositionMapper;
	private _diff: LevenshteinStringsDiffResult;

	constructor(private _astDiffTransformer: AstDiffTransformer, private _config?: LevenshteinStringsDiffConfig) {}

	getPositionMapper(): PositionMapper {
		return this._positionMapper;
	}

	getDiff(): LevenshteinStringsDiffResult {
		return this._diff;
	}

	getAstDiffTransformer(): AstDiffTransformer {
		return this._astDiffTransformer;
	}

	calculateData() {
		const { oldStrings, newStrings } = this._astDiffTransformer.getStrings();
		this._diff = new LevenshteinStringsDiff(oldStrings, newStrings, this._config).getDiff();
		this._positionMapper = new PositionMapper(this._diff.deletedIdxes, this._diff.addedIdxes);
	}
}
