const { getAbout, upsertAbout } = require("../repositories/about.repo");

const normalizeAbout = (about) => {
  if (about) return about;
  return {
    title: "About Us",
    subtitle: "",
    content: "",
    highlights: "",
    image_url: ""
  };
};

const getAboutPublic = async (req, res) => {
  const about = await getAbout(req.tenantId);
  res.json(normalizeAbout(about));
};

const getAboutAdmin = async (req, res) => {
  const about = await getAbout(req.tenantId);
  res.json(normalizeAbout(about));
};

const updateAbout = async (req, res) => {
  const { title, subtitle, content, highlights, imageUrl } = req.validated.body;
  const id = await upsertAbout({ tenantId: req.tenantId, title, subtitle, content, highlights, imageUrl });
  res.json({ id });
};

module.exports = { getAboutPublic, getAboutAdmin, updateAbout };
