const { createContact, listContacts, updateContactStatus } = require("../repositories/contact.repo");

const create = async (req, res) => {
  const { name, email, phone, subject, message } = req.validated.body;
  const id = await createContact({ tenantId: req.tenantId, name, email, phone, subject, message });
  res.status(201).json({ id });
};

const list = async (req, res) => {
  const data = await listContacts(req.tenantId);
  res.json(data);
};

const updateStatus = async (req, res) => {
  const { status } = req.validated.body;
  await updateContactStatus(req.tenantId, req.params.id, status);
  res.json({ ok: true });
};

module.exports = { create, list, updateStatus };
