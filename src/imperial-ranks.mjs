/**
 * Imperial Novel's canonical 50-rank progression catalogue.
 *
 * Rank 50 is a founder-only designation and is deliberately excluded from
 * XP progression. This module contains no authorization or identity logic.
 */
const rankRows = [
  ["Imperial Newcomer", 0],
  ["Imperial Initiate", 100],
  ["Imperial Apprentice", 250],
  ["Imperial Disciple", 450],
  ["Imperial Squire", 700],
  ["Imperial Guard", 1000],
  ["Imperial Knight", 1400],
  ["Imperial Baron", 1900],
  ["Imperial Viscount", 2500],
  ["Imperial Count", 3200],
  ["Imperial Marquis", 4100],
  ["Imperial Earl", 5200],
  ["Imperial Duke", 6500],
  ["Imperial Grand Duke", 8000],
  ["Imperial Lord", 9800],
  ["Imperial High Lord", 12000],
  ["Imperial Prince", 14500],
  ["Imperial Grand Prince", 17500],
  ["Imperial Crown Prince", 21000],
  ["Imperial King", 25000],
  ["Imperial High King", 30000],
  ["Imperial Sovereign", 36000],
  ["Imperial High Sovereign", 43000],
  ["Imperial Grand Sovereign", 51000],
  ["Imperial Supreme King", 60000],
  ["Imperial Monarch", 70000],
  ["Imperial Emperor", 82000],
  ["Imperial High Emperor", 96000],
  ["Imperial Grand Emperor", 112000],
  ["Imperial Eternal Emperor", 130000],
  ["Imperial Celestial Emperor", 150000],
  ["Imperial Divine Emperor", 175000],
  ["Imperial Primordial Emperor", 205000],
  ["Imperial Supreme Emperor", 240000],
  ["Imperial Eternal Sovereign", 280000],
  ["Imperial Cosmic Emperor", 330000],
  ["Imperial Galaxy Emperor", 390000],
  ["Imperial Universal Emperor", 460000],
  ["Imperial Multiversal Emperor", 540000],
  ["Imperial Omniversal Emperor", 630000],
  ["Imperial Infinite Sovereign", 730000],
  ["Imperial Absolute Sovereign", 840000],
  ["Imperial Eternal Monarch", 960000],
  ["Imperial Supreme Monarch", 1090000],
  ["Imperial Divine Sovereign", 1230000],
  ["Imperial Primordial Sovereign", 1380000],
  ["Imperial Celestial Sovereign", 1540000],
  ["Imperial Infinite Emperor", 1710000],
  ["Imperial Ultimate Sovereign", 1900000],
].map(([name, minXp], index) => Object.freeze({
  id: index + 1,
  name,
  minXp,
  founderOnly: false,
}));

export const IMPERIAL_FOUNDER_RANK = Object.freeze({
  id: 50,
  name: "Imperial God Emperor",
  minXp: null,
  founderOnly: true,
});

export const IMPERIAL_RANKS = Object.freeze([
  ...rankRows,
  IMPERIAL_FOUNDER_RANK,
]);

/** Resolve only earned progression ranks. Founder rank is never XP-granted. */
export function getImperialProgressionRank(totalXp) {
  const xp = Number.isFinite(Number(totalXp)) ? Math.max(0, Math.floor(Number(totalXp))) : 0;
  let current = rankRows[0];
  for (const rank of rankRows) {
    if (xp < rank.minXp) break;
    current = rank;
  }
  return current;
}

/** Return progress within the current earned rank, capped below founder rank. */
export function getImperialRankProgress(totalXp) {
  const xp = Number.isFinite(Number(totalXp)) ? Math.max(0, Math.floor(Number(totalXp))) : 0;
  const current = getImperialProgressionRank(xp);
  const next = rankRows.find(rank => rank.id === current.id + 1) || null;
  if (!next) {
    return Object.freeze({
      currentRank: current,
      nextRank: null,
      currentXp: xp,
      xpIntoRank: xp - current.minXp,
      xpToNextRank: null,
      progressPercent: 100,
      atEarnedCap: true,
    });
  }
  const span = next.minXp - current.minXp;
  const into = xp - current.minXp;
  return Object.freeze({
    currentRank: current,
    nextRank: next,
    currentXp: xp,
    xpIntoRank: into,
    xpToNextRank: next.minXp - xp,
    progressPercent: Math.max(0, Math.min(100, Math.floor((into / span) * 100))),
    atEarnedCap: false,
  });
}
