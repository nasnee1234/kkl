export function normalizeImageUrl(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';

  let url = raw.startsWith('www.') ? `https://${raw}` : raw;

  const driveFileMatch = url.match(/drive\.google\.com\/file\/d\/([^/]+)/);
  const driveIdMatch = url.includes('drive.google.com')
    ? url.match(/[?&]id=([^&]+)/)
    : null;
  const driveId = driveFileMatch?.[1] || driveIdMatch?.[1];
  if (driveId) {
    return `https://drive.google.com/thumbnail?id=${driveId}&sz=w1000`;
  }

  if (url.includes('dropbox.com')) {
    url = url.replace('www.dropbox.com', 'dl.dropboxusercontent.com');
    url = url.replace(/[?&]dl=0$/, '');
  }

  const imgurPageMatch = url.match(/^https?:\/\/imgur\.com\/([A-Za-z0-9]+)$/);
  if (imgurPageMatch) {
    return `https://i.imgur.com/${imgurPageMatch[1]}.jpg`;
  }

  return encodeURI(url);
}

export function getMenuImageUrl(item) {
  return normalizeImageUrl(
    item?.imageUrl ||
    item?.imageURL ||
    item?.image ||
    item?.photoUrl ||
    item?.photoURL ||
    item?.pictureUrl ||
    ''
  );
}
