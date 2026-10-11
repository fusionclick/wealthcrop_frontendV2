import { usePlatformSettings } from './usePlatformSettings';
import { androidDownloadLabel } from '../utils/appLinks';

export function useAppLinks() {
  const { data } = usePlatformSettings();
  const playStore = data?.play_store_url ?? import.meta.env.VITE_PLAY_STORE_URL ?? '';
  return {
    appStore: data?.app_store_url ?? import.meta.env.VITE_APP_STORE_URL ?? '',
    playStore,
    androidLabel: androidDownloadLabel(playStore),
    whatsapp: String(data?.whatsapp_number ?? import.meta.env.VITE_WHATSAPP_NUMBER ?? '').replace(/\D/g, ''),
  };
}
