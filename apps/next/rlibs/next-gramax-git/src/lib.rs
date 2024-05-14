mod commands;
use neon::prelude::*;

fn hello(mut cx: FunctionContext) -> JsResult<JsString> {
  Ok(cx.string("hello node"))
}

#[neon::main]
fn main(mut cx: ModuleContext) -> NeonResult<()> {
  _ = env_logger::try_init();

  cx.export_function("hello", hello)?;
  cx.export_function("add", commands::add)?;
  cx.export_function("add_remote", commands::add_remote)?;
  cx.export_function("branch_info", commands::branch_info)?;
  cx.export_function("branch_list", commands::branch_list)?;
  cx.export_function("checkout", commands::checkout)?;
  cx.export_function("clone", commands::clone)?;
  cx.export_function("commit", commands::commit)?;
  cx.export_function("delete_branch", commands::delete_branch)?;
  cx.export_function("diff", commands::diff)?;
  cx.export_function("fetch", commands::fetch)?;
  cx.export_function("file_history", commands::file_history)?;
  cx.export_function("get_content", commands::get_content)?;
  cx.export_function("get_parent", commands::get_parent)?;
  cx.export_function("get_remote", commands::get_remote)?;
  cx.export_function("has_remotes", commands::has_remotes)?;
  cx.export_function("init_new", commands::init_new)?;
  cx.export_function("merge", commands::merge)?;
  cx.export_function("new_branch", commands::new_branch)?;
  cx.export_function("push", commands::push)?;
  cx.export_function("reset_all", commands::reset_all)?;
  cx.export_function("restore", commands::restore)?;
  cx.export_function("stash", commands::stash)?;
  cx.export_function("stash_apply", commands::stash_apply)?;
  cx.export_function("stash_delete", commands::stash_delete)?;
  cx.export_function("status", commands::status)?;
  cx.export_function("status_file", commands::status_file)?;
  Ok(())
}
