"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.findProfileForUser = findProfileForUser;
exports.findProfilesForUsers = findProfilesForUsers;
const prisma_1 = __importDefault(require("./prisma"));
// The UserProfile row carries 51 columns, so an `.include('profile', ...)`
// projects its row through a single `json_build_object` call with 102+
// arguments — past PostgreSQL's 100-argument function limit (54023). These
// helpers read profiles with plain top-level queries and stitch the rows (and
// the MasterData relations the eager includes used to load) in memory.
async function fetchProfiles(userIds) {
    return prisma_1.default.orm.public.UserProfile.where((p) => p.userId.in(userIds)).all();
}
async function fetchMasterData(ids) {
    return prisma_1.default.orm.public.MasterData.where((m) => m.id.in(ids)).all();
}
// Full profile row plus its caste/education/occupation/country rows, the shape
// `.include('profile', (p) => p.include('caste')...)` used to return.
async function findProfileForUser(userId) {
    const profiles = await findProfilesForUsers([userId]);
    return profiles.get(userId) ?? null;
}
async function findProfilesForUsers(userIds) {
    const profilesByUser = new Map();
    if (userIds.length === 0)
        return profilesByUser;
    const profiles = await fetchProfiles(userIds);
    const masterDataIds = [
        ...new Set(profiles
            .flatMap((p) => [p.casteId, p.educationId, p.occupationId, p.countryId])
            .filter((id) => id !== null)),
    ];
    const masterDataById = new Map(masterDataIds.length > 0
        ? (await fetchMasterData(masterDataIds)).map((row) => [row.id, row])
        : []);
    for (const profile of profiles) {
        profilesByUser.set(profile.userId, {
            ...profile,
            caste: profile.casteId ? masterDataById.get(profile.casteId) ?? null : null,
            education: profile.educationId ? masterDataById.get(profile.educationId) ?? null : null,
            occupation: profile.occupationId ? masterDataById.get(profile.occupationId) ?? null : null,
            country: profile.countryId ? masterDataById.get(profile.countryId) ?? null : null,
        });
    }
    return profilesByUser;
}
