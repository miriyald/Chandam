export function initAccordions() {
  document.querySelectorAll('.accordion-header').forEach((header, index) => {
    const content = header.nextElementSibling as HTMLElement;

    const headerId = header.id || `accordion-header-${index}`;
    const contentId = content.id || `accordion-content-${index}`;
    header.id = headerId;
    content.id = contentId;

    header.setAttribute('role', 'button');
    header.setAttribute('tabindex', '0');
    header.setAttribute('aria-expanded', 'false');
    header.setAttribute('aria-controls', contentId);
    content.setAttribute('role', 'region');
    content.setAttribute('aria-labelledby', headerId);

    if (!content.style.maxHeight) {
      content.style.maxHeight = '0px';
    }

    const toggle = () => {
      const isOpen = header.classList.contains('open');

      if (isOpen) {
        content.style.maxHeight = '0px';
        header.classList.remove('open');
        header.setAttribute('aria-expanded', 'false');
      } else {
        header.classList.add('open');
        header.setAttribute('aria-expanded', 'true');
        const fullHeight = content.scrollHeight;
        content.style.maxHeight = `${fullHeight}px`;
      }
    };

    header.addEventListener('click', toggle);
    header.addEventListener('keydown', (e: Event) => {
      const key = (e as KeyboardEvent).key;
      if (key === 'Enter' || key === ' ') {
        e.preventDefault();
        toggle();
      }
    });
  });
}

export function openAccordion(id: string) {
  const header = document.querySelector(`#${id} .accordion-header`) as HTMLElement;
  const content = header?.nextElementSibling as HTMLElement;
  if (content) {
    content.style.maxHeight = `${content.scrollHeight}px`;
    header?.classList.add('open');
    header?.setAttribute('aria-expanded', 'true');
  }
}
