# Scene assets

This folder needs one looping video file per entry in
`src/scenes/sceneLibrary.js` (`moonlit-forest.mp4`, `rain-window.mp4`, etc).

These are not included in the repo yet — they need to be sourced from a
royalty-free loop library and dropped in here with matching filenames.
Until they exist, `SceneBackground` will render a blank/black layer for any
scene whose file is missing (the `<video>` tag just fails to load silently).

Recommended specs for consistency:
- 1920x1080, mp4 (H.264) or webm
- Seamless loop (first and last frame should match closely)
- 10–30s loop length is plenty since it repeats
- Keep file size reasonable (a few MB each) since these load in-browser
