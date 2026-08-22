const STREAM_URL_PATTERNS: Record<'twitch' | 'youtube', RegExp> = {
  twitch: /^https?:\/\/(www\.)?twitch\.tv\/[a-zA-Z0-9_]{3,25}\/?(\?.*)?$/i,
  youtube: /^https?:\/\/(www\.)?(youtube\.com\/(channel\/|c\/|@|live\/|watch\?v=)[\w-]+|youtu\.be\/[\w-]+)([/?].*)?$/i,
};

export function isValidStreamUrl(platform: 'twitch' | 'youtube', url: string): boolean {
  const trimmed = url.trim();
  return trimmed ? STREAM_URL_PATTERNS[platform].test(trimmed) : false;
}