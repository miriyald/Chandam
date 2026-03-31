export function initAccordions() {
  document.querySelectorAll('.accordion-header').forEach(header => {
    header.addEventListener('click', () => {
      const content = header.nextElementSibling as HTMLElement;
      const isOpen = content.style.maxHeight !== '0px';
      content.style.maxHeight = isOpen ? '0px' : `${content.scrollHeight}px`;
      header.classList.toggle('open');
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
