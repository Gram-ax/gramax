import { MutableArray } from "core/utils/types";
import { File, ISectionOptions } from "docx";

export type FileChild = MutableArray<ISectionOptions["children"][number]>;

export type IPropertiesOptions = ConstructorParameters<typeof File>[0];
