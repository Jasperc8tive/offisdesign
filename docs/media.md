# Media

Image and document storage with folders, focal points, and a derivatives
pipeline. Every read/write goes through the `@offisdesign/storage`
abstraction — no module imports an S3 SDK directly.

## Model

- `MediaFolder` — tree (`/marketing/hero`, `/products/sofa`, …) with soft
  delete. `path` is the unique canonical address.
- `Media` — one row per uploaded object, with `storageKey`, content type,
  byte size, dimensions, alt text, `focalX`/`focalY` (0–1 fractions), and a
  JSON `derivatives` map (`{ thumb: { key, width, height, contentType }, … }`)
  populated by the image-processing worker.

## Two-phase upload

`POST /v1/admin/media/presign` returns a short-lived signed PUT URL plus the
storage key the client should upload to. Five-minute TTL. The Media row is
created only on `POST /v1/admin/media/finalize` after we confirm the object
landed in storage (`storage.driver.exists(key)`). This:

- keeps the API out of the upload byte path,
- ensures we never persist a Media row pointing at a missing object,
- is identical whether the underlying driver is Local or S3-compatible.

## Endpoints (admin)

| Method | Path                                       | Permission  |
| ------ | ------------------------------------------ | ----------- |
| GET    | `media/folders`                            | `cms:read`  |
| POST   | `media/folders`                            | `cms:write` |
| DELETE | `media/folders/:id`                        | `cms:write` |
| POST   | `media/presign`                            | `cms:write` |
| POST   | `media/finalize`                           | `cms:write` |
| GET    | `media` (with `folderId`, `q`, pagination) | `cms:read`  |
| PATCH  | `media/:id` (alt, filename, folder, focal) | `cms:write` |
| DELETE | `media/:id` (soft)                         | `cms:write` |

There is no public storefront endpoint — media URLs are inlined into the
CMS / catalog payloads consumed by the storefront.

## Derivatives

The `image-processing` BullMQ queue is the foundation for downstream
rendition generation (Sharp / IPX / external service). The worker is a no-op
placeholder; the application service exposes
`MediaApplicationService.writeDerivatives(id, payload)` that the future
worker calls to populate the JSON map. The storefront reads `derivatives`
when rendering responsive images.

## Soft delete + cleanup

`media.deletedAt` flips the row out of normal queries. The
`media-cleanup` cron (24 h) reads soft-deleted rows older than 7 days, asks
the storage driver to delete the object and every derivative, then hard-
deletes the Media row. This decouples editor undo windows from real storage
costs.

## Activity logging

Every `media.create` and `media.delete` is logged via `ActivityService`.
Presign calls log the storage key + content type so we can match logs to
finalized rows.

## Out of scope (Stage 7)

- Bulk drag-and-drop UI (admin).
- AV scanning + content moderation hooks.
- Variants for responsive `srcset` are stubbed in `derivatives` but the
  generator implementation lands when uploads ship to production.
