import { toPng } from "html-to-image";

export const downloadElementAsPng = async (element: HTMLElement, filename: string) => {
  const bgColor =
    document.documentElement.getAttribute("data-theme") === "light" ? "#f4f0e8" : "#08090a";

  // Temporarily expand overflow containers so html-to-image captures full timelines,
  // even if the user has scrolled a horizontal timetable on screen.
  const restored: Array<{
    el: HTMLElement;
    overflow: string;
    overflowX: string;
    overflowY: string;
    width: string;
    maxWidth: string;
    scrollLeft: number;
    scrollTop: number;
  }> = [];

  for (const selector of [".tt-scroll", ".timetable-staged-outer", ".tt-outer"]) {
    element.querySelectorAll<HTMLElement>(selector).forEach((el) => {
      restored.push({
        el,
        overflow: el.style.overflow,
        overflowX: el.style.overflowX,
        overflowY: el.style.overflowY,
        width: el.style.width,
        maxWidth: el.style.maxWidth,
        scrollLeft: el.scrollLeft,
        scrollTop: el.scrollTop,
      });
      el.scrollLeft = 0;
      el.scrollTop = 0;
      el.style.overflow = "visible";
      el.style.overflowX = "visible";
      el.style.overflowY = "visible";
      el.style.maxWidth = "none";
      el.style.width = `${Math.max(el.scrollWidth, el.clientWidth)}px`;
    });
  }

  element.querySelectorAll<HTMLElement>(".tt-outer").forEach((outer) => {
    const widestChild = Array.from(outer.querySelectorAll<HTMLElement>(".tt-scroll, .tt-axis, .tt-track"))
      .reduce((width, child) => Math.max(width, child.scrollWidth, child.offsetWidth), outer.scrollWidth);
    outer.style.width = `${Math.max(outer.scrollWidth, widestChild)}px`;
  });

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
    restored.forEach(({ el, overflow, overflowX, overflowY, width, maxWidth, scrollLeft, scrollTop }) => {
      el.style.overflow = overflow;
      el.style.overflowX = overflowX;
      el.style.overflowY = overflowY;
      el.style.width = width;
      el.style.maxWidth = maxWidth;
      el.scrollLeft = scrollLeft;
      el.scrollTop = scrollTop;
    });
  }
};
