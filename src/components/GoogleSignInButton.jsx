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

  // Client ID set nahi hai to kuch bhi render mat karo — jaisa ooper docstring pehle se
  // kehti hai. Beech mein yahan ek disabled "Sign up with Google (not configured)" button
  // aa gaya tha: visitor ko hamari adhoori configuration dikhane ka koi faida nahi, wo
  // sirf ek mara hua button dekhta hai. Client ID milte hi asli Google button wapas aa
  // jayega, is component mein aur kuch badalne ki zarurat nahi.
  if (!CLIENT_ID) return null;

  return <div ref={slot} className="flex justify-center [color-scheme:light]" />;
}
