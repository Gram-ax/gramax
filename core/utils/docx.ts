import { MutableArray } from "core/utils/types";
import { ISectionOptions,File } from "docx";

export type FileChild = MutableArray<ISectionOptions['children'][number]>

export type IPropertiesOptions = ConstructorParameters<typeof File>[0];