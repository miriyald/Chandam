type RouteHandler = () => void | Promise<void>;

interface Route {
  path: string;
  handler: RouteHandler;
}

export class Router {
  private routes: Route[] = [];

  register(path: string, handler: RouteHandler) {
    this.routes.push({ path, handler });
  }

  async navigate(path: string) {
    history.pushState(null, '', path);
    await this.route();
  }

  async route() {
    const path = window.location.pathname;
    const route = this.routes.find(r => r.path === path);

    if (route) {
      await route.handler();
    } else {
      // Default to home if not found
      const homeRoute = this.routes.find(r => r.path === '/');
      if (homeRoute) await homeRoute.handler();
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
