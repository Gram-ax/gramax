const COMMANDS: &[&str] = &[
  "read_dir",
  "read_link",
  "make_dir",
  "remove_dir",
  "rmfile",
  "mv",
  "make_symlink",
  "getstat",
  "exists",
  "copy",
  "mv",
  "read_dir_stats",
];

fn main() {
  tauri_plugin::Builder::new(COMMANDS).android_path("android").ios_path("ios").build();
}
