import { Crop, ImageObject, ImageObjectTypes, PointerObject, SquareObject, TextObject } from "@ext/markdown/elements/image/edit/model/imageEditorTypes";

export const parse = (crop: string, objects: string): {crop: Crop, objects: ImageObject[]} => {
    const newCrop = transfromToCrop(crop);
    const newObjects = transformToObjects(objects);

    return {crop: newCrop, objects: newObjects};
}

const transfromToCrop = (crop: string): Crop => {
    const [x, y, w, h] = crop.split(",").map((i) => +i).values();
    return {x: x, y: y, w: w, h: h};
}

const transformToObjects = (objects: string): ImageObject[] => {
    const newObjects: ImageObject[] = [];
    if (objects.length === 2 || objects.length === 0) return newObjects;

    objects.split("&").forEach((object) => {
        const data = object.split(",");
        const type: ImageObjectTypes = data[0] as ImageObjectTypes;
        let newObject;

        switch (type) {
            case ImageObjectTypes.Arrow:
                newObject = {
                    type: ImageObjectTypes.Arrow,
                    x: +data[1],
                    y: +data[2],
                    direction: data[3],
                    scale: +data[4],
                    color: data[5],
                } as PointerObject;
                break;
            case ImageObjectTypes.Text:
                newObject = {
                    type: ImageObjectTypes.Text,
                    x: +data[1],
                    y: +data[2],
                    text: data[3],
                    fontSize: +data[4],
                    color: data[5]
                } as TextObject;
                break;
            case ImageObjectTypes.Square:
                newObject = {
                    type: ImageObjectTypes.Square,
                    x: +data[1],
                    y: +data[2],
                    w: +data[3],
                    h: +data[4],
                    thick: +data[5],
                    color: data[6]
                } as SquareObject;
                break;
            default:
                console.warn(`Unknown object type: ${data[2]}`);
        }

        newObjects.push(newObject);
    })

    return newObjects;
}

export const format = (crop: Crop, objects: ImageObject[]): string => {
    return Object.values(crop).join(",") + ":" + 
    (typeof objects === "object" ? objects?.map((data: any, index: number) => {
        if (data.type)
            return (index !== 0 ? "&" : "") + Object.values(data).filter(value => value !== null).join(",");
    }) : "");
}