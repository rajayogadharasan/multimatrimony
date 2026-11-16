import service from '../service.mjs';

const { jwtSecret } = service.input();

export const JWT_SECRET = jwtSecret.expose();
