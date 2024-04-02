#import <Foundation/Foundation.h>
#import <UIKit/UIKit.h>
#import <AuthenticationServices/AuthenticationServices.h>
#import <AuthenticationServices/ASFoundation.h>
#import "bindings/bindings.h"

@interface WebAuthenticationPresentationContextProvider : NSObject <ASWebAuthenticationPresentationContextProviding>

- (instancetype)initWithViewController:(UIViewController*)viewController;

@end

@implementation WebAuthenticationPresentationContextProvider
    UIViewController* _controller;

- (instancetype)initWithViewController:(UIViewController*)controller {
    self = [super init];
    if (self) _controller = controller;
    return self;
}

- (ASPresentationAnchor)presentationAnchorForWebAuthenticationSession:(ASWebAuthenticationSession *)session {
    return _controller.view.window;
}

@end

void start_oauth(NSURL* url, UIViewController* controller) {
    NSLog(@"Start auth: controller addr: %p", controller);
    dispatch_async(dispatch_get_main_queue(), ^{
        ASWebAuthenticationSession* session = [[ASWebAuthenticationSession alloc]
            initWithURL: url
            callbackURLScheme: @"gramax"
            completionHandler: ^(NSURL* _Nullable url, NSError* _Nullable error) {
            if (error) {
                NSLog(@"Error during authentication: %@", error.localizedDescription);
            }
        }];
        
        WebAuthenticationPresentationContextProvider* wrapper = [[WebAuthenticationPresentationContextProvider alloc] initWithViewController: controller];
        session.presentationContextProvider = wrapper;
        [session start];
    });
}


int main(int argc, char * argv[]) {
    ffi::register_oauth_start(&start_oauth);
    ffi::start_app();
    return 0;
}
