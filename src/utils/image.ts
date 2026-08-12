export async function fileToCompressedJpegDataUrl(
  file: File,
  {
    maxDimension = 512,
    quality = 0.85,
    maxBytes = 2_000_000,
  }: { maxDimension?: number; quality?: number; maxBytes?: number } = {},
): Promise<string> {
  // Always recompress to keep size and format consistent.
  // Note: This runs client-side only (file upload handler).
  const objectUrl = URL.createObjectURL(file)
  try {
    const img = new Image()
    img.decoding = 'async'
    img.src = objectUrl
    await img.decode()

    const w = img.naturalWidth || img.width
    const h = img.naturalHeight || img.height
    if (!w || !h) throw new Error('Invalid image')

    const scale = Math.min(1, maxDimension / Math.max(w, h))
    const targetW = Math.max(1, Math.round(w * scale))
    const targetH = Math.max(1, Math.round(h * scale))

    const canvas = document.createElement('canvas')
    canvas.width = targetW
    canvas.height = targetH
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Canvas not supported')

    ctx.drawImage(img, 0, 0, targetW, targetH)

    // Get JPEG; later we can downscale further if needed.
    let dataUrl = canvas.toDataURL('image/jpeg', quality)

    // If still too large, reduce quality and retry once.
    // (Simple heuristic: dataUrl length roughly correlates with bytes.)
    const approxBytes = Math.round((dataUrl.length * 3) / 4)
    if (approxBytes > maxBytes) {
      dataUrl = canvas.toDataURL('image/jpeg', Math.max(0.55, quality - 0.2))
    }

    return dataUrl
  } finally {
    URL.revokeObjectURL(objectUrl)
  }
}

