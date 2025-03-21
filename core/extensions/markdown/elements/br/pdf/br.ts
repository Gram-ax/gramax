import { ContentText } from "pdfmake/interfaces";

export function brHandler(): ContentText[] {
	return [
		{
			text: "\n",
		},
	];
}
