import prisma from './prisma';

// The UserProfile row carries 51 columns, so an `.include('profile', ...)`
// projects its row through a single `json_build_object` call with 102+
// arguments — past PostgreSQL's 100-argument function limit (54023). These
// helpers read profiles with plain top-level queries and stitch the rows (and
// the MasterData relations the eager includes used to load) in memory.

async function fetchProfiles(userIds: string[]) {
  return prisma.orm.public.UserProfile.where((p) => p.userId.in(userIds)).all();
}

type ProfileRow = Awaited<ReturnType<typeof fetchProfiles>>[number];

async function fetchMasterData(ids: number[]) {
  return prisma.orm.public.MasterData.where((m) => m.id.in(ids)).all();
}

type MasterDataRow = Awaited<ReturnType<typeof fetchMasterData>>[number];

export type ProfileWithRelations = ProfileRow & {
  caste: MasterDataRow | null;
  education: MasterDataRow | null;
  occupation: MasterDataRow | null;
  country: MasterDataRow | null;
};

// Full profile row plus its caste/education/occupation/country rows, the shape
// `.include('profile', (p) => p.include('caste')...)` used to return.
export async function findProfileForUser(userId: string): Promise<ProfileWithRelations | null> {
  const profiles = await findProfilesForUsers([userId]);
  return profiles.get(userId) ?? null;
}

export async function findProfilesForUsers(
  userIds: string[],
): Promise<Map<string, ProfileWithRelations>> {
  const profilesByUser = new Map<string, ProfileWithRelations>();
  if (userIds.length === 0) return profilesByUser;

  const profiles = await fetchProfiles(userIds);
  const masterDataIds = [
    ...new Set(
      profiles
        .flatMap((p) => [p.casteId, p.educationId, p.occupationId, p.countryId])
        .filter((id): id is number => id !== null),
    ),
  ];
  const masterDataById = new Map(
    masterDataIds.length > 0
      ? (await fetchMasterData(masterDataIds)).map((row) => [row.id, row] as const)
      : [],
  );

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
