import { toPng } from "html-to-image";

export const downloadElementAsPng = async (element: HTMLElement, filename: string) => {
  const dataUrl = await toPng(element, {
    cacheBust: true,
    pixelRatio: Math.min(2, window.devicePixelRatio || 1),
    backgroundColor: "#08090a",
    filter: (node) => !(node instanceof HTMLElement && node.dataset.exportHidden === "true"),
  });

  const anchor = document.createElement("a");
  anchor.href = dataUrl;
  anchor.download = filename;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
};
