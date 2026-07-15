# Wix CMS setup for Makabongwe

The website reads public course content from a Wix CMS collection named `Courses`.
Supabase remains responsible for private enquiries and, later, applications,
enrolments and payment records.

Until Wix credentials are configured, or if Wix is temporarily unavailable, the
website safely displays the existing programme content from the codebase.

## 1. Create the collection

In the Wix dashboard, open **CMS**, create a **Multiple items** collection and use
the collection ID `Courses`.

Create these fields using the exact field IDs below:

| Field name | Field ID | Wix type | Required | Purpose |
| --- | --- | --- | --- | --- |
| Title | `title` | Text | Yes | Public course or programme name |
| Slug | `slug` | Text | Yes | Stable URL-safe identifier |
| Summary | `summary` | Text | Yes | Short public description |
| Category | `category` | Text | Yes | `accredited`, `flagship`, or `short-course` |
| SAQA ID | `saqaId` | Text | No | Qualification ID for accredited courses |
| NQF Level | `nqfLevel` | Text | No | For example, `NQF Level 2` |
| Duration | `duration` | Text | Yes | For example, `12 months` |
| Location | `location` | Text | No | Delivery location or `Online` |
| Start Date | `startDate` | Date and Time | No | Intake start date |
| End Date | `endDate` | Date and Time | No | Intake end date |
| Application Deadline | `applicationDeadline` | Date and Time | No | Final application date |
| Capacity | `capacity` | Number | No | Total places for the intake or programme |
| Available Spaces | `availableSpaces` | Number | No | Seats available for the intake |
| Normal Price | `normalPrice` | Number | No | Price in South African rand |
| Early-bird Price | `earlyBirdPrice` | Number | No | Discounted price in rand |
| Early-bird Deadline | `earlyBirdDeadline` | Date and Time | No | Last date for the discounted price |
| Accreditation Valid Until | `accreditationValidUntil` | Date and Time | No | Relevant to accredited qualifications |
| Featured | `featured` | Boolean | Yes | Highlights the item on key pages |
| Published | `isPublished` | Boolean | Yes | Set to false to hide an item from the website |
| Display Order | `displayOrder` | Number | Yes | Lower numbers appear first |
| Cover Image | `coverImage` | Image | No | Programme or course image |

The website also respects Wix's built-in hidden-item setting. Set `isPublished`
to `true` for every item that should appear publicly.

## 2. Add the initial content

Add the five accredited qualifications first:

| Display order | Title | Category | SAQA ID | NQF level | Duration |
| --- | --- | --- | --- | --- | --- |
| 1 | National Certificate: Animal Production | accredited | 48976 | NQF Level 2 | 12 months |
| 2 | National Certificate: Animal Production | accredited | 49048 | NQF Level 3 | 12 months |
| 3 | National Certificate: Plant Production | accredited | 49052 | NQF Level 3 | 12 months |
| 4 | National Certificate: Poultry Production | accredited | 49582 | NQF Level 2 | 12 months |
| 5 | National Certificate: Horticulture | accredited | 66589 | NQF Level 2 | 12 months |

Then add **Azibuye Emasisweni** with category `flagship`, followed by the short
programmes with category `short-course`. Prices and intake dates can remain empty
until Makabongwe confirms them.

## 3. Create read-only credentials

Only the Wix account owner or co-owner can create an API key.

1. Open the Wix API Keys Manager.
2. Create a key restricted to the Makabongwe Wix site.
3. Grant only the **Read Data Items** permission needed by the public website.
4. Copy the Site ID from the Wix dashboard URL. It appears after `/dashboard/`.
5. Keep the API key private. Never place it in a browser component or commit it to Git.

## 4. Configure Vercel

Add these environment variables to the Makabongwe Vercel project for Production,
Preview and Development:

```text
WIX_API_KEY
WIX_SITE_ID
WIX_COURSES_COLLECTION_ID=Courses
```

Redeploy after saving the variables. The `/programmes` and `/agriseta` pages will
then load their course lists from Wix CMS.
