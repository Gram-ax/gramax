use convert_case::Case;
use convert_case::Casing;
use quote::format_ident;
use quote::quote;

use proc_macro::TokenStream;

use quote::ToTokens;
use syn::parse::Parse;
use syn::parse::ParseStream;
use syn::parse_macro_input;
use syn::spanned::Spanned;
use syn::Block;
use syn::FnArg;
use syn::Ident;
use syn::ItemFn;
use syn::Pat;
use syn::PatType;
use syn::ReturnType;
use syn::Type;

enum BindingReturn {
  Bytes,
  Json,
  Void,
}

impl Parse for BindingReturn {
  fn parse(input: ParseStream) -> syn::Result<Self> {
    if input.is_empty() {
      return Ok(Self::Void);
    }

    let ident = input.parse::<Ident>()?;
    let ret = match ident.to_string().as_str() {
      "bytes" => Self::Bytes,
      "json" => Self::Json,
      "void" => Self::Void,
      _ => return Err(syn::Error::new(ident.span(), "invalid return type")),
    };

    Ok(ret)
  }
}

struct BindingFn {
  fn_name: Ident,
  args: Vec<(Ident, Box<Type>)>,
  fn_body: Box<Block>,
  return_type: ReturnType,
  binding_return_type: BindingReturn,
}

impl BindingFn {
  fn with_return_type(&mut self, return_type: BindingReturn) {
    self.binding_return_type = return_type;
  }
}

impl Parse for BindingFn {
  fn parse(input: ParseStream) -> syn::Result<Self> {
    let item_fn = input.parse::<ItemFn>()?;
    let fn_name = item_fn.sig.ident;

    let mut args = Vec::new();
    for arg in item_fn.sig.inputs.iter() {
      match arg {
        FnArg::Typed(PatType { pat, ty, .. }) => {
          if let Pat::Ident(pat_ident) = &**pat {
            args.push((pat_ident.ident.clone(), ty.to_owned()));
          } else {
            return Err(syn::Error::new(arg.span(), "non-ident argument in fn args"));
          }
        }
        FnArg::Receiver(_) => {
          return Err(syn::Error::new(arg.span(), "self not allowed in em_bindgen"));
        }
      }
    }

    let fn_body = item_fn.block.clone();
    let return_type = item_fn.sig.output.clone();

    Ok(Self { fn_name, args, fn_body, return_type, binding_return_type: BindingReturn::Void })
  }
}

impl ToTokens for BindingFn {
  fn to_tokens(&self, tokens: &mut proc_macro2::TokenStream) {
    let Self { fn_name, args, return_type, fn_body, binding_return_type } = self;

    let args_fields = args.iter().map(|(ident, ty)| quote! { #ident: #ty }).collect::<Vec<_>>();
    let args = args.iter().map(|(ident, _)| ident).collect::<Vec<_>>();

    let pascal_case_fn_name = fn_name.to_string().from_case(Case::Snake).to_case(Case::Pascal);
    let args_struct_name = format_ident!("{}Args", pascal_case_fn_name);

    let args_struct = quote! {
      #[derive(serde::Deserialize)]
      #[serde(rename_all = "camelCase")]
      struct #args_struct_name {
        #(#args_fields),*
      }
    };

    let return_err = quote! {
      let bytes = match res {
        Ok(res) => Ok(serde_json::to_vec::<String>(&res).expect("unable to serialize")),
        Err(err) => Err(err),
      };
      crate::Buffer::from(bytes)
    };

    let return_type = match return_type {
      ReturnType::Type(_, ty) => ty.clone(),
      ReturnType::Default => syn::parse_quote!(()),
    };

    let ret = match binding_return_type {
      BindingReturn::Bytes => quote! {
        crate::Buffer::from(res)
      },
      BindingReturn::Json => quote! {
        let bytes = match res {
          Ok(res) => Ok(serde_json::to_vec(&res).expect("unable to serialize")),
          Err(err) => Err(err),
        };
        crate::Buffer::from(bytes)
      },
      BindingReturn::Void => quote! {
        match res {
          Ok(_) => crate::Buffer::null(),
          Err(err) => crate::Buffer::from(Err(err)),
        }
      },
    };

    *tokens = quote! {
      #args_struct

      #[no_mangle]
      unsafe extern "C" fn #fn_name(len: usize, ptr: *const u8) -> crate::threading::JobCallbackId {

        let send_ptr = ptr as usize;

        crate::threading::run(move || {
          let ptr = send_ptr as *mut u8;
          let raw_data = Vec::from_raw_parts(ptr, len, len);
          match serde_json::from_slice::<#args_struct_name>(&raw_data) {
            Ok(args) => {
              let #args_struct_name { #(#args),* } = args;
              let res: #return_type = #fn_body;
              #ret
            },
            Err(err) => {
              let res = Err(err.to_string());
              #return_err
            }
          }
        })
      }
    };
  }
}

#[proc_macro_attribute]
pub fn em_bindgen(attr: TokenStream, item: TokenStream) -> TokenStream {
  let mut fn_def = parse_macro_input!(item as BindingFn);
  fn_def.with_return_type(parse_macro_input!(attr as BindingReturn));

  TokenStream::from(fn_def.to_token_stream())
}
