// Converts a YouTube watch/share/shorts URL into an embeddable URL. Returns
// null for anything that isn't a recognizable YouTube link, so callers can
// skip rendering the video button instead of embedding a broken iframe.
export function toYouTubeEmbedUrl(url: string): string | null {
  try {
    const u = new URL(url.trim());
    if (u.hostname !== 'youtu.be' && !u.hostname.endsWith('youtube.com')) return null;

    let id = '';
    if (u.hostname === 'youtu.be') {
      id = u.pathname.slice(1);
    } else if (u.pathname.startsWith('/watch')) {
      id = u.searchParams.get('v') || '';
    } else if (u.pathname.startsWith('/embed/')) {
      id = u.pathname.slice('/embed/'.length);
    } else if (u.pathname.startsWith('/shorts/')) {
      id = u.pathname.slice('/shorts/'.length);
    }
    id = id.split('/')[0];
    if (!id) return null;
    return `https://www.youtube-nocookie.com/embed/${id}`;
  } catch {
    return null;
  }
}
