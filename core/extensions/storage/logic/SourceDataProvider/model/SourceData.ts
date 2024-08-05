import SourceType from "./SourceType";

interface SourceData {
	/**
	 * @default ""
	 */
	userName: string;
	/**
	 * @default ""
	 */
	userEmail: string;
	/**
	 * @default ""
	 */
	sourceType: SourceType;
}

export default SourceData;
