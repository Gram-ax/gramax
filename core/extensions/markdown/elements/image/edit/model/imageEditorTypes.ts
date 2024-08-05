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
	text: string;
	direction: DirectionType;
	onClick?: (index: number) => void;
	changeData?: (index: number, data: any) => void;
}

export type DirectionType = "bottom-left" | "bottom-right" | "top-left" | "top-right";
export interface AnnotationObject extends ImageObject {
	type: ImageObjectTypes.Annotation | ImageObjectTypes.Unknown;
}

export interface SquareObject extends ImageObject {
	type: ImageObjectTypes.Square | ImageObjectTypes.Unknown;
	w: number;
	h: number;
}

export interface Cropper {
	crop: Crop;
	cropEnabled: boolean;
	setCrop: (crop: Crop) => void;
	handleUpdateArea: (crop: Crop) => void;
}

export interface ImageProps {
	src: Url;
	crop?: Crop;
	alt?: string;
	title?: string;
	objects?: ImageObject[];
	onEdit?: (imageProps: ImageProps, element: HTMLDivElement) => void;
}

export interface EditorProps extends ImageProps {
	imageRef?: React.Ref<HTMLDivElement>;
	handleSave: (objects: ImageObject[], crop: Crop) => void;
	handleToggle: () => void;
}

export enum ImageObjectTypes {
	Annotation = "annotation",
	Square = "square",
	Unknown = "unknown",
}

export interface AdditionData {
	type: "image" | "object";
	index: number;
	data: ImageProps | ImageObject;
	newIndex?: number;
}
