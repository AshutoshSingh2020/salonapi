const normalizeDomain = (value) => {
  if (value === null || value === undefined) return null;
  let raw = String(value).trim().toLowerCase();
  if (!raw) return null;

  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(raw)) {
    try {
      raw = new URL(raw).hostname;
    } catch (_error) {
      // fall through to conservative parsing below
    }
  }

  raw = raw.split(/[/?#]/)[0];
  raw = raw.split(":")[0];
  raw = raw.replace(/\.+$/, "");

  return raw || null;
};

module.exports = { normalizeDomain };
