/// The God won't save us
#[macro_export]
macro_rules! define_c_api {
  {$($mod: ident fn $fn_name:ident($($arg:ident: $arg_t:ty),*) -> $ret:ty $body:block)*} => {
      use std::ffi::c_void;

      use serde::Deserialize;

      $(#[no_mangle]
      pub unsafe extern "C" fn $fn_name(len: usize, ptr: *mut u8) -> *const c_void {
        #[derive(Deserialize)]
        #[serde(rename_all = "camelCase")]
        struct Args { $($arg: $arg_t),* }

        fn inner($($arg: $arg_t),*) -> Result<$ret> $body
        let vec = Vec::from_raw_parts(ptr, len, len);
        let val = serde_json::from_slice::<Args>(&vec).expect("couldn't deserialize json args");

        let rt_ptr = $crate::ret!($mod inner($(val.$arg),*) => $ret);
        // println!("{}(..) -> ret {:p}; len {}; {}", stringify!($fn_name), rt_ptr.ptr, rt_ptr.len, stringify!($mod));
        rt_ptr.boxed()
      })*
  }
}

#[macro_export]
macro_rules! ret {
  (noreturn $res: expr => $ret: ty) => {{
    match $res {
      Ok(_) => $crate::Buffer::null(),
      Err(err) => {
        let bytes = serde_json::to_vec(&err).expect("unable to serialize wasm error");
        $crate::Buffer::from(bytes)
      }
    }
  }};
  (bytes $res: expr => $ret: ty) => {{
    let bytes = match $res {
      Ok(res) => res,
      Err(err) => serde_json::to_vec(&err).expect("unable to serialize wasm error"),
    };
    $crate::Buffer::from(bytes)
  }};
  (json $res: expr => $ret: ty) => {{
    let bytes = match $res {
      Ok(res) => serde_json::to_vec::<$ret>(&res).expect("unable to serialize"),
      Err(err) => serde_json::to_vec(&err).expect("unable to serialize wasm error"),
    };
    $crate::Buffer::from(bytes)
  }};
}
