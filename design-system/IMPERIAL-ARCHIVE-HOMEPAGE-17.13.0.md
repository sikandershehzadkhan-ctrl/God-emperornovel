# Imperial Novel 17.13.0: Imperial Archive homepage correction

## What changed
- Removed the legacy two-column hero portal card from the homepage runtime.
- Removed the quick-link tile row directly below the hero so the first screen has a clearer editorial hierarchy.
- Reworked the homepage hero into a single-column layout with restrained imperial purple, sapphire, white and obsidian, using CSS geometry instead of a decorative hero image.
- Kept search, genre entry points, reader promises, catalog shelves and the creator/discovery routes.
- Added release-specific runtime, CSS and PWA manifest assets so old cached filenames cannot masquerade as the new release.
- Updated deployment and post-deployment checks to fail unless the live homepage serves the new runtime and the legacy hero markup is absent.

## Important verification boundary
A successful build is not visual confirmation. The release is not considered verified until the live health endpoint reports 17.13.0 and the live homepage/assets checks pass. Browser screenshot review remains outstanding if the browser connector is unavailable.
