import { useEffect, useRef } from "react";

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const GSI_SRC = "https://accounts.google.com/gsi/client";

/**
 * Google Sign-In button. Google hands us an ID token in the callback; the caller posts it to
 * /api/internal/auth/google, which verifies it and returns our own JWT.
 *
 * Renders nothing when VITE_GOOGLE_CLIENT_ID is unset, so the form still works without it.
 *
 * ponytail: Google Identity Services loaded from its own script tag — @react-oauth/google is a
 * thin wrapper over exactly these two calls and would render the same iframe button.
 */
export default function GoogleSignInButton({ onCredential, text = "signup_with" }) {
  const slot = useRef(null);
  const callback = useRef(onCredential);
  callback.current = onCredential;

  useEffect(() => {
    if (!CLIENT_ID) return;

    const render = () => {
      if (!window.google?.accounts?.id || !slot.current) return;
      window.google.accounts.id.initialize({
        client_id: CLIENT_ID,
        callback: (res) => callback.current?.(res?.credential),
      });
      window.google.accounts.id.renderButton(slot.current, {
        theme: "outline",
        size: "large",
        shape: "pill",
        width: 360,
        text,
      });
    };

    if (window.google?.accounts?.id) {
      render();
      return;
    }

    const existing = document.querySelector(`script[src="${GSI_SRC}"]`);
    if (existing) {
      existing.addEventListener("load", render);
      return () => existing.removeEventListener("load", render);
    }

    const script = document.createElement("script");
    script.src = GSI_SRC;
    script.async = true;
    script.defer = true;
    script.addEventListener("load", render);
    document.head.appendChild(script);

    return () => script.removeEventListener("load", render);
  }, [text]);

  // Until the client ID is set, keep the button visible but inert rather than leaving a hole
  // where users expect it — the tooltip says exactly what is missing.
  if (!CLIENT_ID) {
    return (
      <button
        type="button"
        disabled
        title="Set VITE_GOOGLE_CLIENT_ID in your frontend .env to enable Google sign-in"
        className="w-full cursor-not-allowed rounded-lg border border-gray-300 py-2 font-medium text-gray-400
                   dark:border-white/10 dark:text-gray-500"
      >
        Sign up with Google (not configured)
      </button>
    );
  }

  return <div ref={slot} className="flex justify-center [color-scheme:light]" />;
}
