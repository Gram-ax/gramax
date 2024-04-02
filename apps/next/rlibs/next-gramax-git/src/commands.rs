use gramaxgit::commands as git;
use neon::prelude::*;
use std::path::Path;
use std::path::PathBuf;

struct GitError(gramaxgit::commands::GitError);

impl std::ops::Deref for GitError {
  type Target = gramaxgit::commands::GitError;

  fn deref(&self) -> &Self::Target {
    &self.0
  }
}

macro_rules! js_obj {
  ($cx: expr, $val: expr) => {{
    let val = $val.or_else(|err| match neon_serde::to_value_js(&mut $cx, &err) {
      Ok(err) => $cx.throw(err),
      Err(err) => $cx.throw_error(format!("{:?}", err)),
    })?;
    neon_serde::to_value_js(&mut $cx, &val)
  }};
}

macro_rules! run {
  ($cx: expr, git::$fn:ident($($arg: expr),*)) => {{
    let path = $cx.argument::<JsString>(0)?.value(&mut $cx);
    Ok($cx.task(move || git::$fn(Path::new(&path), $($arg),*)).promise(|mut cx, r| js_obj!(cx, r)))
  }};
}

macro_rules! get_opt_arg {
  ($cx:expr, $index:expr) => {
    $cx
      .argument_opt($index)
      .filter(|arg| !(arg.is_a::<JsNull, _>(&mut $cx) || arg.is_a::<JsUndefined, _>(&mut $cx)))
      .map(|m| m.downcast_or_throw::<JsString, _>(&mut $cx).map(|m| m.value(&mut $cx)))
      .transpose()
  };
}

pub(crate) fn init_new(mut cx: FunctionContext) -> JsResult<JsPromise> {
  let creds = cx.argument(1)?;
  let creds = neon_serde::from_value_js(&mut cx, creds)?;

  run!(cx, git::init_new(creds))
}

pub(crate) fn file_history(mut cx: FunctionContext) -> JsResult<JsPromise> {
  let file_path = cx.argument::<JsString>(1)?.value(&mut cx);
  let count = cx.argument::<JsNumber>(2)?.value(&mut cx) as usize;

  run!(cx, git::file_history(Path::new(&file_path), count))
}

pub(crate) fn branch_info(mut cx: FunctionContext) -> JsResult<JsPromise> {
  let a = get_opt_arg!(cx, 1)?;
  run!(cx, git::branch_info(a.as_deref()))
}

pub(crate) fn branch_list(mut cx: FunctionContext) -> JsResult<JsPromise> {
  run!(cx, git::branch_list())
}

pub(crate) fn fetch(mut cx: FunctionContext) -> JsResult<JsPromise> {
  let creds = cx.argument(1)?;
  let creds = neon_serde::from_value_js(&mut cx, creds)?;

  run!(cx, git::fetch(creds))
}

pub(crate) fn new_branch(mut cx: FunctionContext) -> JsResult<JsPromise> {
  let name = cx.argument::<JsString>(1)?.value(&mut cx);

  run!(cx, git::new_branch(&name))
}

pub(crate) fn delete_branch(mut cx: FunctionContext) -> JsResult<JsPromise> {
  let name = cx.argument::<JsString>(1)?.value(&mut cx);
  let remote = cx.argument::<JsBoolean>(2)?.value(&mut cx);
  let creds = cx.argument(3)?;
  let creds = neon_serde::from_value_js(&mut cx, creds)?;

  run!(cx, git::delete_branch(&name, remote, creds))
}

pub(crate) fn add_remote(mut cx: FunctionContext) -> JsResult<JsPromise> {
  let name = cx.argument::<JsString>(1)?.value(&mut cx);
  let url = cx.argument::<JsString>(2)?.value(&mut cx);

  run!(cx, git::add_remote(&name, &url))
}

pub(crate) fn has_remotes(mut cx: FunctionContext) -> JsResult<JsPromise> {
  run!(cx, git::has_remotes())
}

pub(crate) fn status(mut cx: FunctionContext) -> JsResult<JsPromise> {
  run!(cx, git::status())
}

pub(crate) fn status_file(mut cx: FunctionContext) -> JsResult<JsPromise> {
  let path = cx.argument::<JsString>(1)?.value(&mut cx);

  run!(cx, git::status_file(Path::new(&path)))
}

pub(crate) fn push(mut cx: FunctionContext) -> JsResult<JsPromise> {
  let creds = cx.argument(1)?;
  let creds = neon_serde::from_value_js(&mut cx, creds)?;

  run!(cx, git::push(creds))
}

pub(crate) fn checkout(mut cx: FunctionContext) -> JsResult<JsPromise> {
  let ref_name = cx.argument::<JsString>(1)?.value(&mut cx);
  let force = cx.argument::<JsBoolean>(2)?.value(&mut cx);

  run!(cx, git::checkout(&ref_name, force))
}

pub(crate) fn clone(mut cx: FunctionContext) -> JsResult<JsPromise> {
  let creds = cx.argument(1)?;
  let creds = neon_serde::from_value_js(&mut cx, creds)?;
  let remote_url = cx.argument::<JsString>(2)?.value(&mut cx);
  let branch = get_opt_arg!(cx, 3)?;

  run!(
    cx,
    git::clone(creds, &remote_url, branch.as_deref(), |chunk| {
      println!("cloning {}; chunk: {}/{}", remote_url, chunk.received, chunk.total);
      true
    })
  )
}

pub(crate) fn add(mut cx: FunctionContext) -> JsResult<JsPromise> {
  let patterns = cx.argument::<JsArray>(1)?.as_value(&mut cx);
  let patterns = neon_serde::from_value_js(&mut cx, patterns)?;

  run!(cx, git::add(patterns))
}

pub(crate) fn diff(mut cx: FunctionContext) -> JsResult<JsPromise> {
  let old = cx.argument::<JsString>(1)?.value(&mut cx);
  let new = cx.argument::<JsString>(2)?.value(&mut cx);

  run!(cx, git::diff(&old, &new))
}

pub(crate) fn reset_all(mut cx: FunctionContext) -> JsResult<JsPromise> {
  let hard = cx.argument::<JsBoolean>(1)?.value(&mut cx);
  let head = get_opt_arg!(cx, 2)?;

  run!(cx, git::reset_all(hard, head.as_deref()))
}

pub(crate) fn commit(mut cx: FunctionContext) -> JsResult<JsPromise> {
  let creds = cx.argument(1)?;
  let creds = neon_serde::from_value_js(&mut cx, creds)?;
  let message = cx.argument::<JsString>(2)?.value(&mut cx);
  let parents = cx.argument_opt(3);
  let parents = parents.and_then(|p| neon_serde::from_value_js(&mut cx, p).ok());

  run!(cx, git::commit(creds, &message, parents))
}

pub(crate) fn merge(mut cx: FunctionContext) -> JsResult<JsPromise> {
  let creds = cx.argument(1)?;
  let creds = neon_serde::from_value_js(&mut cx, creds)?;
  let theirs = cx.argument::<JsString>(2)?.value(&mut cx);

  run!(cx, git::merge(creds, &theirs))
}

pub(crate) fn get_content(mut cx: FunctionContext) -> JsResult<JsPromise> {
  let path = cx.argument::<JsString>(1)?.value(&mut cx);
  let oid = get_opt_arg!(cx, 2)?;

  run!(cx, git::get_content(Path::new(&path), oid.as_deref()))
}

pub(crate) fn get_parent(mut cx: FunctionContext) -> JsResult<JsPromise> {
  let oid = cx.argument::<JsString>(1)?.value(&mut cx);

  run!(cx, git::get_parent(&oid))
}

pub(crate) fn restore(mut cx: FunctionContext) -> JsResult<JsPromise> {
  let restore = cx.argument::<JsBoolean>(1)?.value(&mut cx);
  let paths = cx.argument(2)?;
  let paths = neon_serde::from_value_js::<FunctionContext, Vec<String>>(&mut cx, paths)?
    .iter()
    .map(PathBuf::from)
    .collect();

  run!(cx, git::restore(restore, paths))
}

pub(crate) fn get_remote(mut cx: FunctionContext) -> JsResult<JsPromise> {
  run!(cx, git::get_remote())
}

pub(crate) fn stash(mut cx: FunctionContext) -> JsResult<JsPromise> {
  run!(cx, git::stash(None))
}

pub(crate) fn stash_apply(mut cx: FunctionContext) -> JsResult<JsPromise> {
  let oid = cx.argument::<JsString>(1)?.value(&mut cx);
  run!(cx, git::stash_apply(&oid))
}

pub(crate) fn stash_delete(mut cx: FunctionContext) -> JsResult<JsPromise> {
  let oid = cx.argument::<JsString>(1)?.value(&mut cx);
  run!(cx, git::stash_delete(&oid))
}
