/**
 * Icon helper - provides Material Design SVG icons as strings
 */

export function getIconSVG(iconName: string, size: number = 16): string {
    const icons: Record<string, string> = {
        // Material Design Icons (24x24 viewBox)
        link: `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="currentColor"><path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z"/></svg>`,

        "play-circle": `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/></svg>`,

        book: `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="currentColor"><path d="M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM9 4h6v2H9V4zm12 16H3V4c0-.55.45-1 1-1h14c.55 0 1 .45 1 1v16z"/></svg>`,

        dictionary: `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="currentColor"><path d="M3 9h4V5H3v4zm0 5h4v-4H3v4zm5 0h4v-4H8v4zm5 0h4v-4h-4v4zM8 9h4V5H8v4zm8-4v4h4V5h-4zm0 9h4v-4h-4v4zM3 19h4v-4H3v4zm5 0h4v-4H8v4zm5 0h4v-4h-4v4zm5-14v4h4V5h-4zm0 9h4v-4h-4v4zm0 5h4v-4h-4v4z"/></svg>`,

        wrench: `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="currentColor"><path d="M22.7 19l-9.1-9.1c.9-2.3.4-5-1.5-6.9-2-2-5-2.4-7.4-1.3L9 6 6 9 1.6 4.7C.4 7.1.9 10.1 2.9 12.1c1.9 1.9 4.6 2.4 6.9 1.5l9.1 9.1c.4.4 1 .4 1.4 0l2.3-2.3c.5-.4.5-1.1.1-1.4z"/></svg>`,

        people: `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="currentColor"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>`,

        microscope: `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5h3V9h4v3h3l-5 5z"/></svg>`,

        help: `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="currentColor"><path d="M11 18h2v-2h-2v2zm1-16C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm0-14c-2.21 0-4 1.79-4 4h2c0-1.1.9-2 2-2s2 .9 2 2c0 2-3 1.75-3 5h2c0-2.25 3-2.5 3-5 0-2.21-1.79-4-4-4z"/></svg>`,

        library: `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="currentColor"><path d="M4 6h16v2H4zm.5 4H6v12h.5zm1.5 0h2v12H6zm3 0h2v12H9zm3 0h2v12h-2zm3 0h2v12h-2zm3 0h2v12h-2z"/></svg>`,

        video: `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="currentColor"><path d="M18 3H6c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 9l-5-3.5v7L8 12z"/></svg>`,

        code: `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="currentColor"><path d="M9.4 16.6L4.8 12l4.6-4.6L6.6 6l-6 6 6 6 2.8-2.4zm5.2 0l4.6-4.6-4.6-4.6 2.8-2.8 6 6-6 6-2.8-2.4z"/></svg>`,
    };

    return icons[iconName] || icons.link; // Default to link icon
}

/**
 * Maps resource type to icon name
 */
export function getIconNameForType(type: string): string {
    const typeToIcon: Record<string, string> = {
        link: "link",
        youtube: "play-circle",
        book: "book",
        dictionary: "dictionary",
        tool: "wrench",
        community: "people",
        research: "microscope",
    };
    return typeToIcon[type] || "link";
}

/**
 * Maps group id to icon name
 */
export function getIconNameForGroup(groupId: string): string {
    const groupToIcon: Record<string, string> = {
        intro: "help",
        books: "book",
        libraries: "library",
        videos: "video",
        tools: "wrench",
        dictionaries: "dictionary",
        communities: "people",
        research: "microscope",
        internal: "code",
    };
    return groupToIcon[groupId] || "help";
}
