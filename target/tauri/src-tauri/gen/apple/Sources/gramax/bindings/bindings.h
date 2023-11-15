#pragma once

typedef void (*oauth_start_t)(NSURL*, UIViewController*);

namespace ffi {
    extern "C" {
        void start_app();
        void register_oauth_start(oauth_start_t fn);
    }
}

