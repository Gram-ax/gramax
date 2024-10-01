/// The God won't save us
#[macro_export]
macro_rules! define_c_api {
  {$($mod: ident fn $fn_name:ident($($arg:ident: $arg_t:ty),*) -> $ret:ty $body:block)*} => {
      $(#[no_mangle]
        pub unsafe extern "C" fn $fn_name(len: usize, ptr: *mut u8) -> $crate::threading::JobCallbackId {
          let ptr = ptr as usize;

          $crate::threading::run(move || {
            #[derive(serde::Deserialize)]
            #[serde(rename_all = "camelCase")]
            struct Args { $($arg: $arg_t),* }

          #[inline(always)]
          fn inner($($arg: $arg_t),*) -> Result<$ret> $body

          let vec = Vec::from_raw_parts(ptr as *mut u8, len, len);
          let val = serde_json::from_slice::<Args>(&vec);
          match val {
            Ok(val) => $crate::ret!($mod inner($(val.$arg),*) => $ret),
            Err(err) => $crate::ret!(json Err(err.to_string()) => String)
          }
        })
      })*
  }
}

#[macro_export]
macro_rules! ret {
  (noreturn $res: expr => $ret: ty) => {
    match $res {
      Ok(_) => $crate::Buffer::null(),
      Err(err) => $crate::Buffer::from(Err(err)),
    }
  };
  (bytes $res: expr => $ret: ty) => {
    $crate::Buffer::from($res)
  };
  (json $res: expr => $ret: ty) => {{
    let bytes = match $res {
      Ok(res) => Ok(serde_json::to_vec::<$ret>(&res).expect("unable to serialize")),
      Err(err) => Err(err),
    };
    $crate::Buffer::from(bytes)
  }};
}
