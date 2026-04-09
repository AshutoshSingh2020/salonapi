const { asNumber, getCollection, nextId, stripMongoIds } = require("./_mongo");

const createContact = async ({ tenantId, name, email, phone, subject, message }) => {
  const id = await nextId("contact_messages");
  await getCollection("contact_messages").insertOne({
    id,
    tenant_id: asNumber(tenantId),
    name,
    email: email || null,
    phone: phone || null,
    subject: subject || null,
    message,
    status: "new",
    created_at: new Date()
  });
  return id;
};

const listContacts = async (tenantId) => {
  const rows = await getCollection("contact_messages")
    .find({ tenant_id: asNumber(tenantId) })
    .sort({ created_at: -1, id: -1 })
    .toArray();
  return stripMongoIds(rows);
};

const updateContactStatus = async (tenantId, id, status) => {
  await getCollection("contact_messages").updateOne(
    { id: asNumber(id), tenant_id: asNumber(tenantId) },
    { $set: { status } }
  );
};

module.exports = { createContact, listContacts, updateContactStatus };
