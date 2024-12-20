import {
	Crop,
	ImageObject,
	ImageObjectTypes,
	AnnotationObject,
	SquareObject,
} from "@ext/markdown/elements/image/edit/model/imageEditorTypes";

export const parse = (
	crop: string,
	scale: string,
	objects: string,
	width: number,
	height: number,
): { crop: Crop; objects: ImageObject[]; scale?: number; width: number; height: number } => {
	const scaleIsObjects = isObjects(scale);
	const newCrop = transfromToCrop(crop);
	const newObjects = transformToObjects((scaleIsObjects ? scale : objects) ?? "[]");

	return {
		crop: newCrop,
		objects: newObjects,
		scale: (!scaleIsObjects && scale !== null ? +scale : null) ?? null,
		width: width,
		height: height,
	};
};

const isObjects = (objects: string): boolean => {
	return objects?.length > 3;
};

const transfromToCrop = (crop: string): Crop => {
	const [x, y, w, h] = crop
		.split(",")
		.map((i) => +i)
		.values();
	return { x: x, y: y, w: w, h: h };
};

const transformToObjects = (objects: string): ImageObject[] => {
	const newObjects: ImageObject[] = [];
	if (objects.length === 2 || objects.length === 0) return newObjects;

	objects.split("&").forEach((object) => {
		const data = object.split(",");
		const type: ImageObjectTypes = data[0] as ImageObjectTypes;
		let newObject;

		switch (type) {
			case ImageObjectTypes.Annotation:
				newObject = {
					type: ImageObjectTypes.Annotation,
					x: +data[1],
					y: +data[2],
					text: data[3],
					direction: data[4],
				} as AnnotationObject;
				break;
			case ImageObjectTypes.Square:
				newObject = {
					type: ImageObjectTypes.Square,
					x: +data[1],
					y: +data[2],
					w: +data[3],
					h: +data[4],
					text: data[5],
					direction: data[6],
				} as SquareObject;
				break;
			default:
				console.warn(`Unknown object type: ${data[2]}`);
		}

		newObjects.push(newObject);
	});

	return newObjects;
};

export const format = (width: number, height: number, crop: Crop, objects: ImageObject[], scale?: number): string => {
	const hasSize = width && height;
	return (
		Object.values(crop).join(",") +
		":" +
		(scale || "") +
		":" +
		(Array.isArray(objects)
			? objects?.map((data: any, index: number) => {
					if (data.type) return (index !== 0 ? "&" : "") + Object.values(data).join(",");
			  })
			: ":") +
		":" +
		(hasSize ? width + ":" + height : "")
	);
};
