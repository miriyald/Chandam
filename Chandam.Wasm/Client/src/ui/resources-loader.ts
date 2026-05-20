/**
 * Resources page loader - loads JSON and renders resource groups and items
 */

import { getLanguage } from "../i18n";
import { getIconSVG, getIconNameForType } from "../utils/icon-helper";
import { makeUrl } from "../utils/url-helpers";
import { extractYouTubeVideoId, getYouTubeThumbnailUrl, isYouTubeUrl } from "../utils/youtube-helper";

interface ResourceItem {
  link: string | null;
  text: string;
  description: string;
  type: string;
}

interface ResourceGroup {
  id: string;
  title: string;
  groupIcon: string;
  items: ResourceItem[];
}

interface ResourcesData {
  groups: ResourceGroup[];
}

/**
 * Resolves locale from the direct static page path or the active SPA language.
 */
function resolveLocale(): "en" | "te" {
  const path = window.location.pathname;
  if (path.includes("/pages/te/")) return "te";
  if (path.includes("/pages/en/")) return "en";
  return getLanguage();
}

/**
 * Loads resources JSON and renders the page
 */
export async function loadResourcesPage(): Promise<void> {
  const locale = resolveLocale();
  const jsonPath = makeUrl(`/pages/${locale}/resources.json`);

  try {
    const response = await fetch(jsonPath);
    if (!response.ok) throw new Error(`Failed to load resources: ${response.status}`);

    const data: ResourcesData = await response.json();
    renderResources(data.groups);
  } catch (error) {
    console.error("Error loading resources page:", error);
  }
}

/**
 * Renders nav index into #resources-nav and groups into #resources-content
 */
function renderResources(groups: ResourceGroup[]): void {
  const nav = document.getElementById("resources-nav");
  if (nav) {
    nav.innerHTML = groups
      .map((g) => {
        const href = makeUrl("/resources") + `#${g.id}`;
        return `<a href="${href}">${g.title}</a>`;
      })
      .join("");
  }

  const container = document.getElementById("resources-content");
  if (!container) return;

  container.innerHTML = groups
    .map((group) => renderGroup(group))
    .join("");
}

/**
 * Renders a single resource group section
 */
function renderGroup(group: ResourceGroup): string {
  const groupIcon = getIconSVG(group.groupIcon, 20);

  const itemsHtml = group.items
    .map((item) => renderItem(item))
    .join("");

  return `
    <section id="${group.id}" class="resource-section">
      <h3>${groupIcon} ${group.title}</h3>
      <div class="resource-grid">
        ${itemsHtml}
      </div>
    </section>
  `;
}

/**
 * Renders a single resource item card
 */
function renderItem(item: ResourceItem): string {
  if (item.type === "youtube" && item.link && isYouTubeUrl(item.link)) {
    return renderYouTubeCard(item);
  }
  return renderTextCard(item);
}

/**
 * Renders a text-based resource card
 */
function renderTextCard(item: ResourceItem): string {
  const iconName = getIconNameForType(item.type);
  const icon = getIconSVG(iconName, 16);

  const href = item.link ? resolveResourceLink(item.link) : null;
  const linkAttributes = href
    ? getLinkAttributes(href)
    : "";

  const titleContent = item.link
    ? `<a href="${href}"${linkAttributes}>${item.text}</a>`
    : item.text;

  return `
    <article class="resource-card">
      <div class="item-header">
        <span class="item-icon">${icon}</span>
        <h4>${titleContent}</h4>
      </div>
      <p>${item.description}</p>
    </article>
  `;
}

function resolveResourceLink(link: string): string {
  return link.startsWith("/") ? makeUrl(link) : link;
}

function getLinkAttributes(href: string): string {
  return ' target="_blank" rel="noopener noreferrer"';
}

/**
 * Renders a YouTube card with thumbnail and play badge
 */
function renderYouTubeCard(item: ResourceItem): string {
  const videoId = extractYouTubeVideoId(item.link!);
  const href = resolveResourceLink(item.link!);
  const linkAttributes = getLinkAttributes(href);

  // If video ID can't be extracted, render as text card
  if (!videoId) {
    return renderTextCard(item);
  }

  const thumbnailUrl = getYouTubeThumbnailUrl(videoId);
  const playBadge = getIconSVG("play-circle", 48);

  return `
    <article class="resource-card resource-card-youtube">
      <div class="youtube-thumb">
        <img 
          src="${thumbnailUrl}" 
          alt="${item.text}"
          onerror="this.style.display='none'"
        />
        <div class="youtube-play-badge">${playBadge}</div>
      </div>
      <h4>
        <a href="${href}"${linkAttributes}>${item.text}</a>
      </h4>
      <p>${item.description}</p>
    </article>
  `;
}


