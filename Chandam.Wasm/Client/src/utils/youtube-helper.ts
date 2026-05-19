/**
 * YouTube helper - extracts video IDs and generates thumbnail URLs
 */

export function extractYouTubeVideoId(url: string): string | null {
    if (!url) return null;

    try {
        // Handle youtu.be/VIDEO_ID format
        let match = url.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
        if (match) return match[1];

        // Handle youtube.com/watch?v=VIDEO_ID format
        match = url.match(/youtube\.com\/watch\?.*v=([a-zA-Z0-9_-]{11})/);
        if (match) return match[1];

        // Handle youtube.com/playlist?list=PLAYLIST_ID - extract as is
        match = url.match(/youtube\.com\/playlist\?.*list=([a-zA-Z0-9_-]+)/);
        if (match) return match[1]; // Return playlist ID (won't have valid thumbnail, but won't crash)

        // YouTube channels (@handle) and search results don't have valid video thumbnails
        return null;
    } catch {
        return null;
    }
}

export function getYouTubeThumbnailUrl(videoId: string): string {
    return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
}

export function isYouTubeUrl(url: string): boolean {
    if (!url) return false;
    return /youtube\.com|youtu\.be/.test(url);
}
