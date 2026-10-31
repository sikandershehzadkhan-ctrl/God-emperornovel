export function createDonationReferenceIndexEnsurer() {
  let ready = null;

  return async function ensureDonationReferenceIndex(env) {
    if (!ready) {
      ready = env.DB.prepare(
        "CREATE UNIQUE INDEX IF NOT EXISTS idx_donations_reference_normalized ON donations(LOWER(TRIM(reference_id)))"
      ).run();
    }

    try {
      await ready;
    } catch (error) {
      ready = null;
      throw error;
    }
  };
}
