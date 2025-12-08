import type { XmlComponent } from "docx";

export interface FileChild extends XmlComponent {
	readonly fileChild: symbol;
}
