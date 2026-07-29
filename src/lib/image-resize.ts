function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("이미지를 불러올 수 없습니다."));
    };
    img.src = url;
  });
}

function fitDimensions(width: number, height: number, max: number) {
  if (width <= max && height <= max) return { width, height };
  const scale = width > height ? max / width : max / height;
  return { width: Math.round(width * scale), height: Math.round(height * scale) };
}

export async function resizeImageFile(
  file: File,
  maxDimension = 1600,
  quality = 0.8,
): Promise<Blob> {
  const img = await loadImage(file);
  const { width, height } = fitDimensions(img.naturalWidth, img.naturalHeight, maxDimension);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("캔버스를 사용할 수 없습니다.");
  ctx.drawImage(img, 0, 0, width, height);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("이미지 압축에 실패했습니다."))),
      "image/jpeg",
      quality,
    );
  });
}
