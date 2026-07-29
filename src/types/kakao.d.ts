interface KakaoAuthorizeOptions {
  redirectUri: string;
  state?: string;
  scope?: string;
}

interface KakaoAPIRequestOptions {
  url: string;
  data?: Record<string, unknown>;
}

interface KakaoStatic {
  init: (jsKey: string) => void;
  isInitialized: () => boolean;
  Auth: {
    authorize: (options: KakaoAuthorizeOptions) => void;
    getAccessToken: () => string | null | undefined;
    setAccessToken: (token: string) => void;
    logout: (callback?: () => void) => void;
  };
  API: {
    request: <T = unknown>(options: KakaoAPIRequestOptions) => Promise<T>;
  };
}

interface Window {
  Kakao?: KakaoStatic;
}
