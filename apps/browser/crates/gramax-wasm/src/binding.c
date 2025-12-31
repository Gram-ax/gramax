#include <emscripten/emscripten.h>

EM_JS(int, _em_lfs_http_init, (const char *url, size_t buf_size, const char *method, const char *access_token), {
  const urlString = UTF8ToString(url);
  const methodString = UTF8ToString(method);
  const accessTokenString = UTF8ToString(access_token);
  return Module.em_lfs_http_init(urlString, buf_size, methodString, accessTokenString);
});

EM_ASYNC_JS(int, _em_http_read, (int connId, const char *ptr, size_t len), {
  return await Module.em_http_read(connId, ptr, len);
});

EM_JS(void, _em_lfs_http_set_header, (int connId, const char *header, const char *value), {
  const headerString = UTF8ToString(header);
  const valueString = UTF8ToString(value);
  Module.em_lfs_http_set_header(connId, headerString, valueString);
});

EM_ASYNC_JS(int, _em_lfs_http_send, (int connId, const char *body, size_t len), {
  if (len > 0) {
    const bytes = Module.HEAPU8.buffer.slice(body, body + len);
    const sharedView = new Uint8Array(bytes);
    const regularBuffer = new ArrayBuffer(sharedView.length);
    const regularView = new Uint8Array(regularBuffer);
    regularView.set(sharedView);

    return await Module.em_lfs_http_send(connId, regularView);
  }
  
  const bodyString = body > 0 ? UTF8ToString(body) : null;
  return await Module.em_lfs_http_send(connId, bodyString);
});

EM_JS(int, _em_http_write, (int connId, const char *ptr, size_t len), {
  return Module.em_http_write(connId, ptr, len);
});

EM_JS(int, _em_http_free, (int connId), {
  return Module.em_http_free(connId);
});

int em_lfs_http_init(const char *url, size_t buf_size, const char *method, const char *access_token) {
  return _em_lfs_http_init(url, buf_size, method, access_token);
}

void em_lfs_http_set_header(int connId, const char *header, const char *value) {
  _em_lfs_http_set_header(connId, header, value);
}

int em_lfs_http_send(int connId, const char *body, size_t len) {
  return _em_lfs_http_send(connId, body, len);
}

int em_http_read(int connId, const char *ptr, size_t len) {
  return _em_http_read(connId, ptr, len);
}

int em_http_write(int connId, const char *ptr, size_t len) {
  return _em_http_write(connId, ptr, len);
}

void em_http_free(int connId) {
  _em_http_free(connId);
}
