import { STORAGE_DIR_NAME } from "@app/config/const";
import Path from "@core/FileProvider/Path/Path";

export const MODULITH_BASE = new Path(`${STORAGE_DIR_NAME}/.modulith`);
export const CACHE_DIR = new Path(".cache");

export const TENANT_NAME = "local4";
