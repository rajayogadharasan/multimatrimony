import service from '../service.mjs';

const { db } = service.load();

export default db.client;
