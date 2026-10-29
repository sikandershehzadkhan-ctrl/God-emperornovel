# Imperial Novel 17.12.0: Imperial Archive art direction

Design method: `Leonxlnx/taste-skill`, `design-taste-frontend` with its app-screen principles where the reading product becomes an interface.

## The idea

**The Imperial Library is an archive of worlds; readers choose the next door and authors build the worlds beyond it.** The black-sun crest and open-gate motif belong to Imperial Novel rather than to a generic book catalogue.

## Design decisions

- Product name remains **Imperial Novel**, with **Read • Create • Conquer**. The deployment/repository name is infrastructure only.
- The first screen says what the product lets people do: **Open a world. Shape an empire.**
- The search form remains the one live action on the first screen. It works as a normal GET form, so it does not depend on client-side animation.
- Palette: obsidian as the ground, white for reading, imperial purple for authorship/primary action, sapphire for discovery. Gold and rainbow accents are not part of this release direction.
- Hero and panels use flat surfaces, quiet borders, clear type hierarchy and no resting drop shadows or decorative gradient haze.
- The mobile stylesheet removes backdrop blur, background grid and unnecessary shadows to reduce GPU work on lower-end phones.
- The updated mark is versioned in the URL; the manifest and runtime use release-specific names to reduce stale-cache surprises.
- Navigation translations now include English, Urdu, Hindi, Simplified and Traditional Chinese, Japanese, Indonesian, French, Korean, Brazilian Portuguese, Arabic and Spanish. Urdu and Arabic use right-to-left document direction.

## Release checks

The GitHub validation workflow checks JavaScript syntax, the application build, Worker bundle dry-run, production-safety invariants and SQLite migration compatibility. The post-deploy workflow additionally checks the 17.12.0 runtime, hero copy, language markers, icon, manifest and new CSS.

## Not claimed as complete

A real-browser screenshot review at desktop, tablet and phone widths remains necessary. The connected browser session was unavailable during this pass, so no screenshot-based Taste Skill critique or live production verification is claimed. Production is not changed by this branch alone; changes remain subject to the open pull request and its deployment gates.
