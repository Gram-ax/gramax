import Url from "@core-ui/ApiServices/Types/Url";
import React from "react";

export interface Crop {
	x: number;
	y: number;
	w: number;
	h: number;
}

export interface ImageObject {
	type: unknown;
	x: number;
	y: number;
	onClick?: (elementProps: [HTMLDivElement, number]) => boolean;
	changeData?: (data: ImageObject, prevData: ImageObject, index: number, noAddition?: boolean) => void;
}

export interface PointerObject extends ImageObject {
	type: ImageObjectTypes.Arrow | ImageObjectTypes.Unknown;
	direction: "down-left" | "down-right" | "up-left" | "up-right";
	scale: number;
	color?: string;
}

export interface TextObject extends ImageObject {
	type: ImageObjectTypes.Text | ImageObjectTypes.Unknown;
	text: string;
	fontSize: number;
	color: string;
}

export interface SquareObject extends ImageObject {
	type: ImageObjectTypes.Square | ImageObjectTypes.Unknown;
	w: number;
	h: number;
	thick: number;
	color: string;
}

export interface Cropper {
	crop: Crop;
	cropEnabled: boolean;
	setCrop: (crop: Crop) => void;
}

export interface ImageProps {
	src: string | Url;
	crop?: Crop;
	alt?: string;
	title?: string;
	objects?: ImageObject[];
	onEdit?: (imageProps: ImageProps, element: HTMLDivElement) => void;
}

export interface EditorProps {
	imageProps?: ImageProps;
	imageRef?: React.Ref<HTMLDivElement>;
	handleSave: (objects: ImageObject[], crop: Crop) => void;
	handleToggle: () => void;
}

export enum ImageObjectTypes {
	Arrow = "arrow",
	Text = "text",
	Square = "square",
	Unknown = "unknown",
}