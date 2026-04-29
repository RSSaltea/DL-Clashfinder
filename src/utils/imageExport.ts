import { toPng } from "html-to-image";

export const downloadElementAsPng = async (element: HTMLElement, filename: string) => {
  const bgColor =
    document.documentElement.getAttribute("data-theme") === "light" ? "#f4f0e8" : "#08090a";

  // Temporarily expand overflow containers so html-to-image captures full content
  const restored: Array<{ el: HTMLElement; overflow: string; width: string; maxWidth: string }> = [];
  for (const selector of [".tt-outer", ".tt-scroll", ".timetable-staged-outer"]) {
    element.querySelectorAll<HTMLElement>(selector).forEach((el) => {
      restored.push({ el, overflow: el.style.overflow, width: el.style.width, maxWidth: el.style.maxWidth });
      el.style.overflow = "visible";
      el.style.maxWidth = "none";
      if (el.scrollWidth > el.clientWidth) {
        el.style.width = `${el.scrollWidth}px`;
      }
    });
  }

  const captureWidth = element.scrollWidth;
  const captureHeight = element.scrollHeight;

  try {
    const dataUrl = await toPng(element, {
      cacheBust: true,
      pixelRatio: Math.min(2, window.devicePixelRatio || 1),
      backgroundColor: bgColor,
      width: captureWidth,
      height: captureHeight,
      filter: (node) => !(node instanceof HTMLElement && node.dataset.exportHidden === "true"),
    });

    const anchor = document.createElement("a");
    anchor.href = dataUrl;
    anchor.download = filename;
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
  } finally {
    restored.forEach(({ el, overflow, width, maxWidth }) => {
      el.style.overflow = overflow;
      el.style.width = width;
      el.style.maxWidth = maxWidth;
    });
  }
};
