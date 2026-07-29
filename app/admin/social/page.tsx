'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Youtube, Facebook, Instagram, Upload, Send, Clock,
  CheckCircle, XCircle, AlertCircle, RefreshCw, Trash2,
  ChevronDown, ChevronUp, Eye, EyeOff, Hash, Image as ImageIcon,
  Film, BarChart2, Library, Wifi, WifiOff, Link as LinkIcon, Unlink,
  ExternalLink,
} from 'lucide-react';
import { SOCIAL_URLS } from '@/lib/business';

// ─── Types ───────────────────────────────────────────────────────────────────

interface ConnectedPlatform {
  platform: 'youtube' | 'facebook' | 'instagram';
  connected: boolean;
  pageName?: string;
  username?: string;
  profileImage?: string;
  followers?: number;
  expiresAt?: string;
}

interface SocialPost {
  id: string;
  title: string;
  caption: string;
  platforms: string[];
  publish_mode: string;
  scheduled_at?: string;
  yt_status?: string;
  fb_status?: string;
  ig_status?: string;
  yt_url?: string;
  fb_url?: string;
  ig_url?: string;
  yt_error?: string;
  fb_error?: string;
  ig_error?: string;
  created_at: string;
  published_at?: string;
}

interface MediaItem {
  id: string;
  file_name: string;
  public_url: string;
  mime_type: string;
  file_size: number;
  created_at: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const PLATFORM_ICONS = {
  youtube:   { Icon: Youtube,   color: '#FF0000', bg: '#FF0000/10', label: 'YouTube'   },
  facebook:  { Icon: Facebook,  color: '#1877F2', bg: '#1877F2/10', label: 'Facebook'  },
  instagram: { Icon: Instagram, color: '#E1306C', bg: '#E1306C/10', label: 'Instagram' },
};

// Live profile links — same URLs used in the site footer (lib/business.ts)
const SOCIAL_PROFILE_LINKS = [
  { platform: 'facebook',  label: 'Facebook',  subtitle: 'Visit Page',    href: SOCIAL_URLS.facebook,  Icon: Facebook,  color: '#1877F2' },
  { platform: 'instagram', label: 'Instagram', subtitle: 'Visit Profile', href: SOCIAL_URLS.instagram, Icon: Instagram, color: '#E1306C' },
  { platform: 'youtube',   label: 'YouTube',   subtitle: 'View Channel',  href: SOCIAL_URLS.youtube,   Icon: Youtube,   color: '#FF0000' },
] as const;

const STATUS_CONFIG: Record<string, { icon: typeof CheckCircle; color: string; label: string }> = {
  published: { icon: CheckCircle,  color: 'text-emerald-400', label: 'Published'  },
  uploading: { icon: RefreshCw,    color: 'text-amber-400',   label: 'Uploading'  },
  failed:    { icon: XCircle,      color: 'text-red-400',     label: 'Failed'     },
  skipped:   { icon: AlertCircle,  color: 'text-zinc-500',    label: 'Skipped'    },
  draft:     { icon: Eye,          color: 'text-blue-400',    label: 'Draft'      },
};

const YT_CATEGORIES = [
  { id: '1',  label: 'Film & Animation'    },
  { id: '2',  label: 'Autos & Vehicles'    },
  { id: '10', label: 'Music'               },
  { id: '17', label: 'Sports'              },
  { id: '19', label: 'Travel & Events'     },
  { id: '20', label: 'Gaming'              },
  { id: '22', label: 'People & Blogs'      },
  { id: '23', label: 'Comedy'              },
  { id: '24', label: 'Entertainment'       },
  { id: '25', label: 'News & Politics'     },
  { id: '26', label: 'Howto & Style'       },
  { id: '27', label: 'Education'           },
  { id: '28', label: 'Science & Technology'},
];

function fmtSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function StatusBadge({ status }: { status?: string }) {
  const cfg = STATUS_CONFIG[status ?? 'skipped'] ?? STATUS_CONFIG.skipped;
  const { icon: Icon, color, label } = cfg;
  const spin = status === 'uploading';
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium ${color}`}>
      <Icon size={12} className={spin ? 'animate-spin' : ''} />
      {label}
    </span>
  );
}

function PlatformCard({
  p, onConnect, onDisconnect,
}: {
  p: ConnectedPlatform;
  onConnect: (pl: string) => void;
  onDisconnect: (pl: string) => void;
}) {
  const { Icon, color, label } = PLATFORM_ICONS[p.platform];
  return (
    <div className="bg-[#1e1a14] border border-[#b8893a]/20 rounded-xl p-4 flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <Icon size={28} style={{ color }} />
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-[#e8d49b]">{label}</div>
          {p.connected && (
            <div className="text-xs text-[#e8d49b]/60 truncate">
              {p.username ?? p.pageName ?? 'Connected'}
            </div>
          )}
        </div>
        <span className={`flex items-center gap-1 text-xs font-medium ${p.connected ? 'text-emerald-400' : 'text-zinc-500'}`}>
          {p.connected ? <Wifi size={12} /> : <WifiOff size={12} />}
          {p.connected ? 'Connected' : 'Disconnected'}
        </span>
      </div>
      {p.connected && p.followers != null && (
        <div className="text-xs text-[#e8d49b]/50">
          {p.followers.toLocaleString('en-IN')} followers
        </div>
      )}
      <div className="flex gap-2">
        {p.connected ? (
          <>
            <button
              onClick={() => onConnect(p.platform)}
              className="flex-1 flex items-center justify-center gap-1.5 text-xs py-2 rounded-lg bg-[#b8893a]/10 text-[#b8893a] hover:bg-[#b8893a]/20 transition"
            >
              <RefreshCw size={12} /> Reconnect
            </button>
            <button
              onClick={() => onDisconnect(p.platform)}
              className="flex items-center justify-center gap-1.5 text-xs px-3 py-2 rounded-lg bg-red-900/20 text-red-400 hover:bg-red-900/40 transition"
            >
              <Unlink size={12} /> Disconnect
            </button>
          </>
        ) : (
          <button
            onClick={() => onConnect(p.platform)}
            className="flex-1 flex items-center justify-center gap-1.5 text-xs py-2 rounded-lg bg-[#b8893a] text-[#1a1410] font-semibold hover:bg-[#d4a554] transition"
          >
            <LinkIcon size={12} /> Connect
          </button>
        )}
      </div>
    </div>
  );
}

function PostRow({ post, onRetry }: { post: SocialPost; onRetry: (id: string) => void }) {
  const [expanded, setExpanded] = useState(false);
  const platforms = (post.platforms ?? []) as ('youtube' | 'facebook' | 'instagram')[];

  return (
    <div className="bg-[#1e1a14] border border-[#b8893a]/15 rounded-xl overflow-hidden">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-start gap-4 p-4 text-left hover:bg-[#b8893a]/5 transition"
      >
        <Film size={18} className="mt-0.5 text-[#b8893a] shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-[#e8d49b] truncate">{post.title || '(no title)'}</div>
          <div className="text-xs text-[#e8d49b]/50 mt-0.5">{fmtDate(post.created_at)}</div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {platforms.map((pl) => {
            const status = pl === 'youtube' ? post.yt_status : pl === 'facebook' ? post.fb_status : post.ig_status;
            const { Icon, color } = PLATFORM_ICONS[pl];
            const cfg = STATUS_CONFIG[status ?? 'skipped'];
            return (
              <span key={pl} title={`${PLATFORM_ICONS[pl].label}: ${cfg?.label ?? status}`}>
                <Icon size={16} style={{ color }} />
              </span>
            );
          })}
          {expanded ? <ChevronUp size={16} className="text-[#e8d49b]/40" /> : <ChevronDown size={16} className="text-[#e8d49b]/40" />}
        </div>
      </button>

      {expanded && (
        <div className="border-t border-[#b8893a]/10 p-4 space-y-3">
          {post.caption && (
            <p className="text-xs text-[#e8d49b]/70 whitespace-pre-line line-clamp-3">{post.caption}</p>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {platforms.map((pl) => {
              const status = pl === 'youtube' ? post.yt_status : pl === 'facebook' ? post.fb_status : post.ig_status;
              const url    = pl === 'youtube' ? post.yt_url    : pl === 'facebook' ? post.fb_url    : post.ig_url;
              const err    = pl === 'youtube' ? post.yt_error  : pl === 'facebook' ? post.fb_error  : post.ig_error;
              const { Icon, color, label } = PLATFORM_ICONS[pl];
              return (
                <div key={pl} className="bg-[#14110c] rounded-lg p-3 space-y-1.5">
                  <div className="flex items-center gap-1.5">
                    <Icon size={14} style={{ color }} />
                    <span className="text-xs font-medium text-[#e8d49b]">{label}</span>
                  </div>
                  <StatusBadge status={status} />
                  {url && (
                    <a href={url} target="_blank" rel="noopener noreferrer"
                      className="block text-xs text-[#b8893a] underline truncate">
                      View post
                    </a>
                  )}
                  {err && <p className="text-xs text-red-400 break-words">{err}</p>}
                </div>
              );
            })}
          </div>
          {platforms.some((pl) => {
            const s = pl === 'youtube' ? post.yt_status : pl === 'facebook' ? post.fb_status : post.ig_status;
            return s === 'failed';
          }) && (
            <button
              onClick={() => onRetry(post.id)}
              className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg bg-amber-900/20 text-amber-400 hover:bg-amber-900/40 transition"
            >
              <RefreshCw size={12} /> Retry failed platforms
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function SocialPage() {
  const [tab, setTab] = useState<'publish' | 'history' | 'library' | 'platforms'>('publish');

  // Platforms
  const [platforms, setPlatforms] = useState<ConnectedPlatform[]>([]);
  const [platformsLoading, setPlatformsLoading] = useState(true);

  // Upload
  const [videoFile,    setVideoFile]    = useState<File | null>(null);
  const [thumbFile,    setThumbFile]    = useState<File | null>(null);
  const [uploadPct,    setUploadPct]    = useState(0);
  const [uploading,    setUploading]    = useState(false);
  const [mediaId,      setMediaId]      = useState('');
  const [videoUrl,     setVideoUrl]     = useState('');
  const [thumbUrl,     setThumbUrl]     = useState('');

  // Form
  const [title,        setTitle]        = useState('');
  const [caption,      setCaption]      = useState('');
  const [hashtagInput, setHashtagInput] = useState('');
  const [hashtags,     setHashtags]     = useState<string[]>([]);
  const [selPlatforms, setSelPlatforms] = useState<('youtube' | 'facebook' | 'instagram')[]>([]);
  const [publishMode,  setPublishMode]  = useState<'now' | 'scheduled' | 'draft'>('now');
  const [scheduledAt,  setScheduledAt]  = useState('');
  const [ytCategory,   setYtCategory]   = useState('22');
  const [ytVisibility, setYtVisibility] = useState<'public' | 'private' | 'unlisted'>('public');
  const [ytTags,       setYtTags]       = useState('');
  const [ytIsShorts,   setYtIsShorts]   = useState(false);
  const [ytMadeForKids, setYtMadeForKids] = useState(false);
  const [showYtOpts,   setShowYtOpts]   = useState(false);
  const [publishing,   setPublishing]   = useState(false);
  const [publishResult, setPublishResult] = useState<{ postId: string; status: string } | null>(null);
  const [formError,    setFormError]    = useState('');

  // History
  const [posts,        setPosts]        = useState<SocialPost[]>([]);
  const [postsTotal,   setPostsTotal]   = useState(0);
  const [postsPage,    setPostsPage]    = useState(1);
  const [postsLoading, setPostsLoading] = useState(false);

  // Library
  const [media,        setMedia]        = useState<MediaItem[]>([]);
  const [mediaTotal,   setMediaTotal]   = useState(0);
  const [mediaLoading, setMediaLoading] = useState(false);

  const videoInputRef = useRef<HTMLInputElement>(null);
  const thumbInputRef = useRef<HTMLInputElement>(null);

  // ── Load platforms ──────────────────────────────────────────────────────────
  const loadPlatforms = useCallback(async () => {
    setPlatformsLoading(true);
    try {
      const r = await fetch('/api/social/platforms');
      const d = await r.json();
      const all: ConnectedPlatform[] = (['youtube', 'facebook', 'instagram'] as const).map((pl) => {
        const found = (d.platforms ?? []).find((p: ConnectedPlatform) => p.platform === pl);
        return found ?? { platform: pl, connected: false };
      });
      setPlatforms(all);
    } catch { /* ignore */ }
    setPlatformsLoading(false);
  }, []);

  useEffect(() => { loadPlatforms(); }, [loadPlatforms]);

  // ── Load posts history ──────────────────────────────────────────────────────
  const loadPosts = useCallback(async (page = 1) => {
    setPostsLoading(true);
    try {
      const r = await fetch(`/api/social/posts?page=${page}&limit=20`);
      const d = await r.json();
      setPosts(d.posts ?? []);
      setPostsTotal(d.total ?? 0);
      setPostsPage(page);
    } catch { /* ignore */ }
    setPostsLoading(false);
  }, []);

  useEffect(() => { if (tab === 'history') loadPosts(1); }, [tab, loadPosts]);

  // ── Load media library ──────────────────────────────────────────────────────
  const loadMedia = useCallback(async () => {
    setMediaLoading(true);
    try {
      const r = await fetch('/api/social/media');
      const d = await r.json();
      setMedia(d.media ?? []);
      setMediaTotal(d.total ?? 0);
    } catch { /* ignore */ }
    setMediaLoading(false);
  }, []);

  useEffect(() => { if (tab === 'library') loadMedia(); }, [tab, loadMedia]);

  // ── Connect / disconnect ────────────────────────────────────────────────────
  const handleConnect = (pl: string) => {
    window.location.href = `/api/social/auth/${pl}`;
  };

  const handleDisconnect = async (pl: string) => {
    if (!confirm(`Disconnect ${pl}? This removes the stored token.`)) return;
    await fetch('/api/social/platforms', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ platform: pl }),
    });
    loadPlatforms();
  };

  // ── Video upload ────────────────────────────────────────────────────────────
  const handleVideoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setVideoFile(file);
    setUploading(true);
    setUploadPct(0);
    setFormError('');

    const form = new FormData();
    form.append('file', file);

    const xhr = new XMLHttpRequest();
    xhr.upload.onprogress = (ev) => {
      if (ev.lengthComputable) setUploadPct(Math.round((ev.loaded / ev.total) * 100));
    };
    xhr.onload = () => {
      setUploading(false);
      if (xhr.status === 200) {
        const d = JSON.parse(xhr.responseText);
        setMediaId(d.mediaId);
        setVideoUrl(d.url);
      } else {
        const d = JSON.parse(xhr.responseText);
        setFormError(d.error ?? 'Upload failed');
        setVideoFile(null);
      }
    };
    xhr.onerror = () => {
      setUploading(false);
      setFormError('Network error during upload');
      setVideoFile(null);
    };
    xhr.open('POST', '/api/social/upload');
    xhr.send(form);
  };

  const handleThumbSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setThumbFile(file);
    setThumbUrl(URL.createObjectURL(file));
  };

  // ── Hashtags ────────────────────────────────────────────────────────────────
  const addHashtags = () => {
    const tags = hashtagInput
      .split(/[\s,]+/)
      .map((t) => t.replace(/^#/, '').trim())
      .filter(Boolean);
    setHashtags((prev) => [...new Set([...prev, ...tags])]);
    setHashtagInput('');
  };

  const removeHashtag = (tag: string) => setHashtags((prev) => prev.filter((t) => t !== tag));

  // ── Toggle platform ─────────────────────────────────────────────────────────
  const togglePlatform = (pl: 'youtube' | 'facebook' | 'instagram') => {
    setSelPlatforms((prev) =>
      prev.includes(pl) ? prev.filter((p) => p !== pl) : [...prev, pl]
    );
  };

  // ── Publish ─────────────────────────────────────────────────────────────────
  const handlePublish = async () => {
    setFormError('');
    if (!videoUrl) { setFormError('Upload a video first'); return; }
    if (!selPlatforms.length) { setFormError('Select at least one platform'); return; }
    if (publishMode === 'scheduled' && !scheduledAt) { setFormError('Set a scheduled date/time'); return; }

    setPublishing(true);
    try {
      const body: Record<string, unknown> = {
        mediaId, videoUrl, title, caption, hashtags, platforms: selPlatforms,
        publishMode, scheduledAt: scheduledAt || undefined,
        thumbnailUrl: thumbUrl || undefined,
        ytCategoryId: ytCategory, ytVisibility,
        ytTags: ytTags.split(',').map((t) => t.trim()).filter(Boolean),
        ytIsShorts, ytMadeForKids,
      };
      const r = await fetch('/api/social/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const d = await r.json();
      if (!r.ok) { setFormError(d.error ?? 'Publish failed'); return; }
      setPublishResult(d);
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'Publish failed');
    } finally {
      setPublishing(false);
    }
  };

  // ── Retry post ──────────────────────────────────────────────────────────────
  const handleRetry = async (postId: string) => {
    await fetch(`/api/social/posts?id=${postId}`, { method: 'PATCH' });
    loadPosts(postsPage);
  };

  // ── Delete media ────────────────────────────────────────────────────────────
  const handleDeleteMedia = async (id: string) => {
    if (!confirm('Delete this video?')) return;
    await fetch(`/api/social/media?id=${id}`, { method: 'DELETE' });
    loadMedia();
  };

  // ── Reset form ──────────────────────────────────────────────────────────────
  const resetForm = () => {
    setVideoFile(null); setThumbFile(null); setUploadPct(0);
    setMediaId(''); setVideoUrl(''); setThumbUrl('');
    setTitle(''); setCaption(''); setHashtags([]); setHashtagInput('');
    setSelPlatforms([]); setPublishMode('now'); setScheduledAt('');
    setYtTags(''); setYtIsShorts(false); setYtMadeForKids(false);
    setPublishResult(null); setFormError('');
    if (videoInputRef.current) videoInputRef.current.value = '';
    if (thumbInputRef.current) thumbInputRef.current.value = '';
  };

  const connectedSet = new Set(platforms.filter((p) => p.connected).map((p) => p.platform));

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-full bg-[#0f0d09] text-[#e8d49b]">
      {/* Header */}
      <div className="border-b border-[#b8893a]/20 px-6 py-5">
        <h1 className="text-xl font-bold tracking-wide text-white">Social Media</h1>
        <p className="text-xs text-[#e8d49b]/50 mt-0.5">Publish videos to YouTube, Facebook & Instagram</p>
      </div>

      {/* Live profile quick links */}
      <div className="px-6 pt-6 pb-2">
        <h2 className="text-sm font-semibold text-[#e8d49b] mb-3">Your Social Profiles</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {SOCIAL_PROFILE_LINKS.map(({ platform, label, subtitle, href, Icon, color }) => (
            <a
              key={platform}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative flex flex-col items-center gap-3 rounded-2xl border-2 bg-[#1e1a14] px-6 py-7 text-center transition hover:-translate-y-0.5 hover:shadow-xl"
              style={{ borderColor: color }}
            >
              <ExternalLink size={14} className="absolute top-4 right-4 text-[#e8d49b]/30 group-hover:text-[#e8d49b]/60 transition" />
              <span
                className="flex items-center justify-center w-14 h-14 rounded-full shadow-md"
                style={{ backgroundColor: color }}
              >
                <Icon size={26} className="text-white" />
              </span>
              <Icon size={44} style={{ color }} strokeWidth={1.5} className="opacity-90" />
              <div>
                <div className="text-base font-bold text-white">{label}</div>
                <div className="text-xs font-semibold" style={{ color }}>{subtitle}</div>
              </div>
            </a>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#b8893a]/20 px-6">
        {([
          { key: 'publish',   label: 'Publish',     icon: Send      },
          { key: 'history',   label: 'History',     icon: Clock     },
          { key: 'library',   label: 'Media Library', icon: Library },
          { key: 'platforms', label: 'Accounts',    icon: Wifi      },
        ] as const).map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-2 px-4 py-3 text-sm border-b-2 transition ${
              tab === key
                ? 'border-[#b8893a] text-[#b8893a]'
                : 'border-transparent text-[#e8d49b]/50 hover:text-[#e8d49b]'
            }`}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      <div className="p-6 max-w-5xl mx-auto space-y-6">

        {/* ── PUBLISH TAB ──────────────────────────────────────────────────── */}
        {tab === 'publish' && (
          <>
            {publishResult ? (
              <div className="bg-[#1e1a14] border border-emerald-500/30 rounded-2xl p-8 text-center space-y-4">
                <CheckCircle size={48} className="mx-auto text-emerald-400" />
                <h2 className="text-lg font-semibold text-white">
                  {publishResult.status === 'draft' ? 'Saved as Draft' : 'Publishing Started'}
                </h2>
                <p className="text-sm text-[#e8d49b]/60">
                  Post ID: <code className="text-[#b8893a]">{publishResult.postId}</code>
                  <br />
                  {publishResult.status === 'publishing'
                    ? 'Your video is being uploaded to the selected platforms in the background.'
                    : 'You can publish this draft from the History tab.'}
                </p>
                <div className="flex gap-3 justify-center">
                  <button onClick={resetForm}
                    className="px-5 py-2 rounded-lg bg-[#b8893a] text-[#1a1410] text-sm font-semibold hover:bg-[#d4a554] transition">
                    Publish another
                  </button>
                  <button onClick={() => { setTab('history'); setPublishResult(null); }}
                    className="px-5 py-2 rounded-lg bg-[#b8893a]/10 text-[#b8893a] text-sm hover:bg-[#b8893a]/20 transition">
                    View history
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left column — video + meta */}
                <div className="lg:col-span-2 space-y-5">

                  {/* Video drop zone */}
                  <div className="bg-[#1e1a14] border border-[#b8893a]/20 rounded-2xl p-5 space-y-4">
                    <h2 className="text-sm font-semibold text-[#e8d49b] flex items-center gap-2">
                      <Film size={16} className="text-[#b8893a]" /> Video
                    </h2>
                    {!videoFile ? (
                      <button
                        onClick={() => videoInputRef.current?.click()}
                        className="w-full border-2 border-dashed border-[#b8893a]/30 rounded-xl p-10 text-center hover:border-[#b8893a]/60 hover:bg-[#b8893a]/5 transition"
                      >
                        <Upload size={32} className="mx-auto mb-2 text-[#b8893a]/50" />
                        <p className="text-sm text-[#e8d49b]/60">Click to select a video</p>
                        <p className="text-xs text-[#e8d49b]/30 mt-1">MP4 · MOV · WebM · max 500 MB</p>
                      </button>
                    ) : (
                      <div className="space-y-3">
                        <div className="flex items-center gap-3 bg-[#14110c] rounded-xl p-3">
                          <Film size={18} className="text-[#b8893a] shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-[#e8d49b] truncate">{videoFile.name}</p>
                            <p className="text-xs text-[#e8d49b]/50">{fmtSize(videoFile.size)}</p>
                          </div>
                          {videoUrl
                            ? <CheckCircle size={18} className="text-emerald-400 shrink-0" />
                            : <span className="text-xs text-amber-400">Uploading {uploadPct}%</span>
                          }
                        </div>
                        {uploading && (
                          <div className="h-1.5 bg-[#14110c] rounded-full overflow-hidden">
                            <div
                              className="h-full bg-[#b8893a] transition-all duration-300"
                              style={{ width: `${uploadPct}%` }}
                            />
                          </div>
                        )}
                        {videoUrl && (
                          <button
                            onClick={() => {
                              setVideoFile(null); setVideoUrl(''); setMediaId('');
                              if (videoInputRef.current) videoInputRef.current.value = '';
                            }}
                            className="text-xs text-red-400 hover:text-red-300"
                          >
                            Remove video
                          </button>
                        )}
                      </div>
                    )}
                    <input ref={videoInputRef} type="file" accept="video/mp4,video/quicktime,video/webm"
                      className="hidden" onChange={handleVideoSelect} />
                  </div>

                  {/* Thumbnail */}
                  <div className="bg-[#1e1a14] border border-[#b8893a]/20 rounded-2xl p-5 space-y-3">
                    <h2 className="text-sm font-semibold text-[#e8d49b] flex items-center gap-2">
                      <ImageIcon size={16} className="text-[#b8893a]" /> Thumbnail <span className="text-[#e8d49b]/30 text-xs font-normal">(optional)</span>
                    </h2>
                    <div className="flex items-center gap-4">
                      {thumbUrl && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={thumbUrl} alt="thumbnail" className="w-28 h-16 object-cover rounded-lg border border-[#b8893a]/30" />
                      )}
                      <button
                        onClick={() => thumbInputRef.current?.click()}
                        className="text-xs px-3 py-2 rounded-lg bg-[#b8893a]/10 text-[#b8893a] hover:bg-[#b8893a]/20 transition"
                      >
                        {thumbFile ? 'Change thumbnail' : 'Select thumbnail'}
                      </button>
                      {thumbFile && (
                        <button onClick={() => { setThumbFile(null); setThumbUrl(''); }}
                          className="text-xs text-red-400 hover:text-red-300">Remove</button>
                      )}
                    </div>
                    <input ref={thumbInputRef} type="file" accept="image/*" className="hidden" onChange={handleThumbSelect} />
                  </div>

                  {/* Title & Caption */}
                  <div className="bg-[#1e1a14] border border-[#b8893a]/20 rounded-2xl p-5 space-y-4">
                    <h2 className="text-sm font-semibold text-[#e8d49b]">Caption</h2>
                    <div>
                      <label className="block text-xs text-[#e8d49b]/50 mb-1">Title</label>
                      <input
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Video title (required for YouTube)"
                        className="w-full bg-[#14110c] border border-[#b8893a]/20 rounded-lg px-3 py-2 text-sm text-[#e8d49b] placeholder-[#e8d49b]/25 focus:outline-none focus:border-[#b8893a]/50"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-[#e8d49b]/50 mb-1">Caption / Description</label>
                      <textarea
                        value={caption}
                        onChange={(e) => setCaption(e.target.value)}
                        rows={4}
                        placeholder="Write your caption here..."
                        className="w-full bg-[#14110c] border border-[#b8893a]/20 rounded-lg px-3 py-2 text-sm text-[#e8d49b] placeholder-[#e8d49b]/25 focus:outline-none focus:border-[#b8893a]/50 resize-none"
                      />
                      <div className="text-right text-xs text-[#e8d49b]/30 mt-0.5">{caption.length} chars</div>
                    </div>

                    {/* Hashtags */}
                    <div>
                      <label className="block text-xs text-[#e8d49b]/50 mb-1 flex items-center gap-1">
                        <Hash size={11} /> Hashtags
                      </label>
                      <div className="flex gap-2">
                        <input
                          value={hashtagInput}
                          onChange={(e) => setHashtagInput(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addHashtags())}
                          placeholder="#jewellery #gold — space or comma separated"
                          className="flex-1 bg-[#14110c] border border-[#b8893a]/20 rounded-lg px-3 py-2 text-sm text-[#e8d49b] placeholder-[#e8d49b]/25 focus:outline-none focus:border-[#b8893a]/50"
                        />
                        <button onClick={addHashtags}
                          className="px-3 py-2 rounded-lg bg-[#b8893a]/10 text-[#b8893a] text-xs hover:bg-[#b8893a]/20 transition">
                          Add
                        </button>
                      </div>
                      {hashtags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {hashtags.map((tag) => (
                            <span key={tag} className="flex items-center gap-1 text-xs bg-[#b8893a]/15 text-[#b8893a] px-2 py-0.5 rounded-full">
                              #{tag}
                              <button onClick={() => removeHashtag(tag)} className="hover:text-red-400">
                                <XCircle size={11} />
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right column — platforms + options */}
                <div className="space-y-5">

                  {/* Platform selector */}
                  <div className="bg-[#1e1a14] border border-[#b8893a]/20 rounded-2xl p-5 space-y-3">
                    <h2 className="text-sm font-semibold text-[#e8d49b]">Platforms</h2>
                    {(['youtube', 'facebook', 'instagram'] as const).map((pl) => {
                      const { Icon, color, label } = PLATFORM_ICONS[pl];
                      const connected = connectedSet.has(pl);
                      const selected  = selPlatforms.includes(pl);
                      return (
                        <button
                          key={pl}
                          disabled={!connected}
                          onClick={() => connected && togglePlatform(pl)}
                          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition ${
                            selected
                              ? 'border-[#b8893a] bg-[#b8893a]/10'
                              : connected
                                ? 'border-[#b8893a]/20 hover:border-[#b8893a]/40'
                                : 'border-[#b8893a]/10 opacity-40 cursor-not-allowed'
                          }`}
                        >
                          <Icon size={18} style={{ color }} />
                          <span className="flex-1 text-sm text-left text-[#e8d49b]">{label}</span>
                          {!connected && <span className="text-xs text-[#e8d49b]/30">Not connected</span>}
                          {connected && selected && <CheckCircle size={14} className="text-[#b8893a]" />}
                        </button>
                      );
                    })}
                    {platforms.some((p) => !p.connected) && (
                      <button
                        onClick={() => setTab('platforms')}
                        className="w-full text-xs text-[#b8893a]/70 hover:text-[#b8893a] underline"
                      >
                        Connect more accounts →
                      </button>
                    )}
                  </div>

                  {/* YouTube-specific options */}
                  {selPlatforms.includes('youtube') && (
                    <div className="bg-[#1e1a14] border border-[#b8893a]/20 rounded-2xl p-5 space-y-3">
                      <button
                        onClick={() => setShowYtOpts((v) => !v)}
                        className="w-full flex items-center justify-between text-sm font-semibold text-[#e8d49b]"
                      >
                        <span className="flex items-center gap-2"><Youtube size={14} className="text-red-500" /> YouTube Options</span>
                        {showYtOpts ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </button>
                      {showYtOpts && (
                        <div className="space-y-3 pt-2 border-t border-[#b8893a]/10">
                          <div>
                            <label className="block text-xs text-[#e8d49b]/50 mb-1">Category</label>
                            <select
                              value={ytCategory}
                              onChange={(e) => setYtCategory(e.target.value)}
                              className="w-full bg-[#14110c] border border-[#b8893a]/20 rounded-lg px-3 py-2 text-sm text-[#e8d49b] focus:outline-none focus:border-[#b8893a]/50"
                            >
                              {YT_CATEGORIES.map((c) => (
                                <option key={c.id} value={c.id}>{c.label}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs text-[#e8d49b]/50 mb-1">Visibility</label>
                            <select
                              value={ytVisibility}
                              onChange={(e) => setYtVisibility(e.target.value as 'public' | 'private' | 'unlisted')}
                              className="w-full bg-[#14110c] border border-[#b8893a]/20 rounded-lg px-3 py-2 text-sm text-[#e8d49b] focus:outline-none focus:border-[#b8893a]/50"
                            >
                              <option value="public">Public</option>
                              <option value="unlisted">Unlisted</option>
                              <option value="private">Private</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs text-[#e8d49b]/50 mb-1">Tags (comma-separated)</label>
                            <input
                              value={ytTags}
                              onChange={(e) => setYtTags(e.target.value)}
                              placeholder="jewellery, gold, india"
                              className="w-full bg-[#14110c] border border-[#b8893a]/20 rounded-lg px-3 py-2 text-sm text-[#e8d49b] placeholder-[#e8d49b]/25 focus:outline-none focus:border-[#b8893a]/50"
                            />
                          </div>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={ytIsShorts}
                              onChange={(e) => setYtIsShorts(e.target.checked)}
                              className="rounded border-[#b8893a]/30 bg-[#14110c] accent-[#b8893a]"
                            />
                            <span className="text-sm text-[#e8d49b]">Upload as YouTube Shorts</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={ytMadeForKids}
                              onChange={(e) => setYtMadeForKids(e.target.checked)}
                              className="rounded border-[#b8893a]/30 bg-[#14110c] accent-[#b8893a]"
                            />
                            <span className="text-sm text-[#e8d49b]">Made for Kids</span>
                          </label>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Publish mode */}
                  <div className="bg-[#1e1a14] border border-[#b8893a]/20 rounded-2xl p-5 space-y-3">
                    <h2 className="text-sm font-semibold text-[#e8d49b]">When to publish</h2>
                    <div className="space-y-1.5">
                      {([
                        { value: 'now',       label: 'Publish now'  },
                        { value: 'scheduled', label: 'Schedule'     },
                        { value: 'draft',     label: 'Save as draft' },
                      ] as const).map(({ value, label }) => (
                        <label key={value} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="publishMode"
                            value={value}
                            checked={publishMode === value}
                            onChange={() => setPublishMode(value)}
                            className="accent-[#b8893a]"
                          />
                          <span className="text-sm text-[#e8d49b]">{label}</span>
                        </label>
                      ))}
                    </div>
                    {publishMode === 'scheduled' && (
                      <input
                        type="datetime-local"
                        value={scheduledAt}
                        onChange={(e) => setScheduledAt(e.target.value)}
                        className="w-full bg-[#14110c] border border-[#b8893a]/20 rounded-lg px-3 py-2 text-sm text-[#e8d49b] focus:outline-none focus:border-[#b8893a]/50"
                      />
                    )}
                  </div>

                  {/* Error */}
                  {formError && (
                    <div className="flex items-start gap-2 bg-red-900/20 border border-red-800/40 rounded-xl px-4 py-3">
                      <XCircle size={16} className="text-red-400 shrink-0 mt-0.5" />
                      <p className="text-sm text-red-300">{formError}</p>
                    </div>
                  )}

                  {/* Publish button */}
                  <button
                    onClick={handlePublish}
                    disabled={publishing || uploading || !videoUrl}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#b8893a] text-[#1a1410] font-bold text-sm tracking-wide hover:bg-[#d4a554] disabled:opacity-40 disabled:cursor-not-allowed transition"
                  >
                    {publishing ? <RefreshCw size={16} className="animate-spin" /> : <Send size={16} />}
                    {publishMode === 'draft' ? 'Save Draft' : publishMode === 'scheduled' ? 'Schedule' : 'Publish Now'}
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* ── HISTORY TAB ──────────────────────────────────────────────────── */}
        {tab === 'history' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-[#e8d49b]">
                Publish History
                {postsTotal > 0 && <span className="ml-2 text-xs text-[#e8d49b]/40">({postsTotal} total)</span>}
              </h2>
              <button onClick={() => loadPosts(postsPage)}
                className="flex items-center gap-1 text-xs text-[#b8893a] hover:text-[#d4a554]">
                <RefreshCw size={12} className={postsLoading ? 'animate-spin' : ''} /> Refresh
              </button>
            </div>
            {postsLoading ? (
              <div className="text-center py-16 text-[#e8d49b]/30 text-sm">Loading…</div>
            ) : posts.length === 0 ? (
              <div className="text-center py-16 text-[#e8d49b]/30 text-sm">No publish history yet.</div>
            ) : (
              <>
                <div className="space-y-3">
                  {posts.map((post) => (
                    <PostRow key={post.id} post={post} onRetry={handleRetry} />
                  ))}
                </div>
                {postsTotal > 20 && (
                  <div className="flex justify-center gap-2 pt-2">
                    <button
                      disabled={postsPage === 1}
                      onClick={() => loadPosts(postsPage - 1)}
                      className="px-4 py-2 text-xs rounded-lg bg-[#1e1a14] border border-[#b8893a]/20 text-[#e8d49b]/60 disabled:opacity-30 hover:text-[#b8893a]"
                    >← Prev</button>
                    <span className="px-4 py-2 text-xs text-[#e8d49b]/40">
                      Page {postsPage} of {Math.ceil(postsTotal / 20)}
                    </span>
                    <button
                      disabled={postsPage >= Math.ceil(postsTotal / 20)}
                      onClick={() => loadPosts(postsPage + 1)}
                      className="px-4 py-2 text-xs rounded-lg bg-[#1e1a14] border border-[#b8893a]/20 text-[#e8d49b]/60 disabled:opacity-30 hover:text-[#b8893a]"
                    >Next →</button>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ── LIBRARY TAB ──────────────────────────────────────────────────── */}
        {tab === 'library' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-[#e8d49b]">
                Media Library
                {mediaTotal > 0 && <span className="ml-2 text-xs text-[#e8d49b]/40">({mediaTotal} files)</span>}
              </h2>
              <button onClick={loadMedia}
                className="flex items-center gap-1 text-xs text-[#b8893a] hover:text-[#d4a554]">
                <RefreshCw size={12} className={mediaLoading ? 'animate-spin' : ''} /> Refresh
              </button>
            </div>
            {mediaLoading ? (
              <div className="text-center py-16 text-[#e8d49b]/30 text-sm">Loading…</div>
            ) : media.length === 0 ? (
              <div className="text-center py-16 text-[#e8d49b]/30 text-sm">No videos uploaded yet.</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {media.map((item) => (
                  <div key={item.id} className="bg-[#1e1a14] border border-[#b8893a]/15 rounded-xl overflow-hidden group">
                    <div className="aspect-video bg-[#14110c] flex items-center justify-center relative">
                      <Film size={32} className="text-[#b8893a]/30" />
                      <div className="absolute inset-0 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition bg-black/50">
                        <a href={item.public_url} target="_blank" rel="noopener noreferrer"
                          className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition">
                          <Eye size={16} className="text-white" />
                        </a>
                        <button onClick={() => handleDeleteMedia(item.id)}
                          className="p-2 rounded-full bg-red-900/40 hover:bg-red-900/60 transition">
                          <Trash2 size={16} className="text-red-400" />
                        </button>
                      </div>
                    </div>
                    <div className="p-3 space-y-1">
                      <p className="text-xs font-medium text-[#e8d49b] truncate">{item.file_name}</p>
                      <div className="flex justify-between text-xs text-[#e8d49b]/40">
                        <span>{fmtSize(item.file_size)}</span>
                        <span>{fmtDate(item.created_at)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── PLATFORMS TAB ────────────────────────────────────────────────── */}
        {tab === 'platforms' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-[#e8d49b]">Connected Accounts</h2>
              <button onClick={loadPlatforms}
                className="flex items-center gap-1 text-xs text-[#b8893a] hover:text-[#d4a554]">
                <RefreshCw size={12} className={platformsLoading ? 'animate-spin' : ''} /> Refresh
              </button>
            </div>

            {/* Info banner */}
            <div className="bg-[#1e1a14] border border-[#b8893a]/20 rounded-xl p-4 text-xs text-[#e8d49b]/60 space-y-1">
              <p className="font-medium text-[#e8d49b]/80">Setup notes</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Connecting Facebook also links your Instagram Business account automatically.</li>
                <li>YouTube requires a Google account with a YouTube channel.</li>
                <li>Tokens are AES-256-GCM encrypted before storage.</li>
              </ul>
            </div>

            {platformsLoading ? (
              <div className="text-center py-12 text-[#e8d49b]/30 text-sm">Loading…</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {platforms.map((p) => (
                  <PlatformCard
                    key={p.platform}
                    p={p}
                    onConnect={handleConnect}
                    onDisconnect={handleDisconnect}
                  />
                ))}
              </div>
            )}

            {/* Env var checklist */}
            <div className="bg-[#1e1a14] border border-[#b8893a]/20 rounded-xl p-4 space-y-3">
              <h3 className="text-xs font-semibold text-[#e8d49b]/80">Required environment variables</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-[#e8d49b]/50 font-mono">
                {[
                  'YOUTUBE_CLIENT_ID', 'YOUTUBE_CLIENT_SECRET',
                  'FACEBOOK_APP_ID', 'FACEBOOK_APP_SECRET',
                  'SOCIAL_ENCRYPTION_KEY', 'NEXT_PUBLIC_SITE_URL',
                ].map((v) => (
                  <div key={v} className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#b8893a]/30 shrink-0" />
                    {v}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
