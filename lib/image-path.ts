export function propertyImageSource(path: string) {
  return path.startsWith('listings/')
    ? `/api/property-image?path=${encodeURIComponent(path)}`
    : path
}
