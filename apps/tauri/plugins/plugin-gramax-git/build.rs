const COMMANDS: &[&str] = &[
  "init_new",
  "clone",
  "file_history",
  "checkout",
  "fetch",
  "stash",
  "stash_apply",
  "push",
  "add",
  "status",
  "status_file",
  "branch_info",
  "new_branch",
  "stash_delete",
  "delete_branch",
  "get_remote",
  "branch_list",
  "diff",
  "add_remote",
  "has_remotes",
  "reset_all",
  "commit",
  "merge",
  "restore",
  "get_parent",
  "get_content",
  "graph_head_upstream_files",
];

fn main() {
  tauri_plugin::Builder::new(COMMANDS).android_path("android").ios_path("ios").build();
}
