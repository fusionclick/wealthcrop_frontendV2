export function androidDownloadLabel(url) {
  try {
    const parsed = new URL(url);
    if (parsed.hostname === 'play.google.com' && parsed.pathname.startsWith('/store/apps')) return 'Google Play (Android)';
    if (/\.apk$/i.test(parsed.pathname)) return 'Download Android APK';
  } catch { /* An unconfigured destination has no download button. */ }
  return 'Android app';
}
