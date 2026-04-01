export function initAccordions() {
  document.querySelectorAll('.accordion-header').forEach(header => {
    const content = header.nextElementSibling as HTMLElement;

    // Initialize to closed state
    if (!content.style.maxHeight) {
      content.style.maxHeight = '0px';
    }

    header.addEventListener('click', () => {
      const isOpen = header.classList.contains('open');

      if (isOpen) {
        // Close
        content.style.maxHeight = '0px';
        header.classList.remove('open');
      } else {
        // Open - temporarily add padding to calculate correct height
        header.classList.add('open');
        const fullHeight = content.scrollHeight;
        content.style.maxHeight = `${fullHeight}px`;
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
  }
}
