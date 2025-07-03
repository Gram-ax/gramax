import Path from "@core/FileProvider/Path/Path";

export const GRAMAX_EDITOR_URL = "https://app.gram.ax";

export const GRAMAX_DIRECTORY = ".gramax" as const;
export const INBOX_DIRECTORY = "inbox" as const;
export const PROMPT_DIRECTORY = "prompt" as const;
export const TEMPLATES_DIRECTORY = "templates" as const;
export const SNIPPETS_DIRECTORY = "snippets" as const;

export const OPEN_MERGE_REQUEST_FILE = "open.yaml" as const;
export const MERGE_REQUEST_DIRECTORY_PATH = new Path([GRAMAX_DIRECTORY, "mr"]);
export const OPEN_MERGE_REQUEST_PATH = MERGE_REQUEST_DIRECTORY_PATH.join(new Path(OPEN_MERGE_REQUEST_FILE));
export const ARCHIVE_MERGE_REQUEST_PATH = MERGE_REQUEST_DIRECTORY_PATH.join(new Path("archive"));

export const DOC_ROOT_FILENAME = ".doc-root.yaml";
export const DOC_ROOT_REGEXP = /.(doc-)?root.ya?ml/;

export const NEW_CATALOG_NAME = "new-catalog";

export const CATEGORY_ROOT_FILENAME = "_index.md";
export const CATEGORY_ROOT_REGEXP = /(_index_\w\w\.md$|_index\.md$)/;

export const NEW_ARTICLE_FILENAME = "new-article";
export const NEW_ARTICLE_REGEX = /^new[-|_]article/;

export const UNIQUE_NAME_SEPARATOR = "-";
export const UNIQUE_NAME_START_IDX = 2;

export const LEFT_NAV_CLASS = "left-navigation-layout";
export const RIGHT_NAV_CLASS = "right-nav-layout";

export const STORAGE_DIR_NAME = ".storage";

export const MAX_ICON_SIZE = 500 * 1024;
