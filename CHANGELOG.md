# Change Log

All notable changes to the "export-files-extension" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

## [0.0.3] - 2025-11-07

### Fixed
- Fix: Changed ignore pattern matching from fuzzy to exact matching. Files like `layout.tsx` and `routers.tsx` will no longer be filtered when `"out"` is in the ignore list. The ignore patterns now only match exact directory or file names in the path.

## [0.0.2] - 2025-11-06

### Fixed
- Fix: Added await in buildDirectoryTree to ensure subdirectory files are included in the exported directory structure.

## [Unreleased]

- Initial release