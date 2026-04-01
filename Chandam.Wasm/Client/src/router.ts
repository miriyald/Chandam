type RouteHandler = (params: Record<string, string>) => void | Promise<void>;

interface Route {
  pattern: string;
  regex: RegExp;
  paramNames: string[];
  handler: RouteHandler;
}

export class Router {
  private routes: Route[] = [];

  register(pattern: string, handler: RouteHandler) {
    // Convert pattern like "/compute/:ruleSet/:ruleId" to regex
    const { regex, paramNames } = this.patternToRegex(pattern);
    this.routes.push({ pattern, regex, paramNames, handler });
  }

  // Convert URL pattern to regex and extract parameter names
  private patternToRegex(pattern: string): { regex: RegExp; paramNames: string[] } {
    const paramNames: string[] = [];

    // Escape special regex characters except :param placeholders
    let regexPattern = pattern
      .replace(/[.+?^${}()|[\]\\]/g, '\\$&') // Escape special chars
      .replace(/:(\w+)/g, (_match, paramName) => {
        paramNames.push(paramName);
        return '([^/]+)'; // Match any characters except /
      });

    // Ensure exact match with optional trailing slash
    regexPattern = `^${regexPattern}/?$`;

    return {
      regex: new RegExp(regexPattern),
      paramNames
    };
  }

  // Match URL against route and extract parameters
  private matchRoute(route: Route, path: string): Record<string, string> | null {
    const match = path.match(route.regex);
    if (!match) return null;

    // Extract parameters from capture groups
    const params: Record<string, string> = {};
    route.paramNames.forEach((name, index) => {
      params[name] = match[index + 1];
    });

    return params;
  }

  async navigate(path: string) {
    history.pushState(null, '', path);
    await this.route();
  }

  async route() {
    const url = new URL(window.location.href);
    const path = url.pathname;

    // Also extract query parameters
    const queryParams: Record<string, string> = {};
    url.searchParams.forEach((value, key) => {
      queryParams[key] = value;
    });

    // Try to match against registered routes
    for (const route of this.routes) {
      const pathParams = this.matchRoute(route, path);
      if (pathParams !== null) {
        // Merge path params and query params
        const allParams = { ...pathParams, ...queryParams };
        await route.handler(allParams);
        return;
      }
    }

    // No match found - try home route
    const homeRoute = this.routes.find(r => r.pattern === '/');
    if (homeRoute) {
      await homeRoute.handler({});
    }
  }

  init() {
    // Handle browser back/forward
    window.addEventListener('popstate', () => this.route());

    // Intercept link clicks
    document.addEventListener('click', (e) => {
      const target = (e.target as HTMLElement).closest('a');
      if (target && target.href && target.origin === location.origin) {
        e.preventDefault();
        this.navigate(new URL(target.href).pathname);
      }
    });

    // Route initial load
    this.route();
  }
}

// Helper to load static HTML pages
export async function loadStaticPage(url: string) {
  const content = document.getElementById('content');
  if (!content) return;

  try {
    const response = await fetch(url);
    if (response.ok) {
      content.innerHTML = await response.text();
    } else {
      content.innerHTML = '<p>Page not found</p>';
    }
  } catch (err) {
    console.error('Failed to load page:', err);
    content.innerHTML = '<p>Error loading page</p>';
  }
}
