import { AlignmentType, LevelFormat, convertMillimetersToTwip } from "docx";
import { IPropertiesOptions } from "docx/build/file/core-properties";

export const wordDocumentStyles: Omit<IPropertiesOptions, "sections"> = {
	numbering: {
		config: [
			{
				reference: "orderedList",
				levels: Array.from({ length: 9 }).map((_, i) => ({
					level: i,
					format: LevelFormat.DECIMAL,
					text: "%1.",
					alignment: AlignmentType.START,
					style: {
						paragraph: {
							indent: {
								left: convertMillimetersToTwip(12.5 * (i + 1)),
								hanging: convertMillimetersToTwip(4.5),
							},
						},
					},
				})),
			},
		],
	},
};
