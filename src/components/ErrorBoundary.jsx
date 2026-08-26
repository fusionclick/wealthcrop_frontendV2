import { Component } from "react";
import ErrorPage from "./ErrorPage";

/**
 * ponytail: React mein error boundary sirf class se banti hai — koi hook equivalent nahi.
 * Fallback ke liye mojooda ErrorPage hi use kiya, naya UI nahi banaya.
 *
 * `resetKey` mein pathname jata hai: error ke baad user kahin aur navigate kare to
 * boundary khud clear ho jati hai. Key ko `key` prop banane ke bajaye state mein
 * compare karte hain — warna har navigation par poora Routes subtree remount hota.
 */
export default class ErrorBoundary extends Component {
  state = { error: null, key: this.props.resetKey };

  static getDerivedStateFromError(error) {
    return { error };
  }

  static getDerivedStateFromProps(props, state) {
    return props.resetKey !== state.key ? { error: null, key: props.resetKey } : null;
  }

  componentDidCatch(error, info) {
    console.error("[ErrorBoundary]", error, info?.componentStack);
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;
    // Production build mein message minified hota hai, is liye dono dikhate hain.
    return <ErrorPage message={`Is page ko load karne mein masla hua. (${error.message || "Unknown error"})`} />;
  }
}
