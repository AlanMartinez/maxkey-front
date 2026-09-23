# Activation Guides Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace each product's free-text Markdown activation guide with a reusable, admin-authored guide page (`ActivationGuide`) that products reference by selection and the storefront renders standalone at `/article/{slug}`.

**Architecture:** New `ActivationGuide` bounded context in the backend (`Maxkeys.Domain/Guides`, mirroring the `Carousel` resource's layering — domain entity → EF configuration → application use cases → minimal-API endpoints), with `Product.ActivationGuideId` replacing `Product.ActivationGuide` (free text). The front gets a new admin CRUD screen, a public `/article/[slug]` page, and `ProductEditor` swaps its Markdown textarea for a guide picker.

**Tech Stack:** Backend: .NET 8, EF Core (Npgsql, snake_case naming), minimal APIs, xUnit. Frontend: Nuxt 3, Vue 3 `<script setup>`, Vitest + `@nuxt/test-utils`, `@imagekit/vue`.

**Spec:** `docs/superpowers/specs/2026-09-23-activation-guides-design.md`

## Global Constraints

- Backend repo root: `C:\Personal\Projects\maxkeys`. Frontend repo root: `C:\Personal\Projects\maxkeys-front` (this repo).
- One use-case class per file (ADR-02), in `Maxkeys.Application.<Context>`.
- Guides have no draft/published state — everything created is visible immediately (spec: Out of scope).
- Guide→Product is many-to-one: many products may reference the same guide. Deleting a referenced guide must fail with `409` (`DomainConflictException`), never silently orphan a product's FK.
- No automatic guide assignment by platform/category — selection is a manual per-product dropdown (spec: Out of scope).
- Every new/changed backend endpoint gets documented in `openspec/changes/mvp-marketplace/design.md` §7 (contract doc convention, per `types/api.ts` header comment).
- Migrations are generated via `dotnet ef migrations add <Name> --project src/Maxkeys.Infrastructure --startup-project src/Maxkeys.Api --output-dir Persistence/Migrations`, never hand-written.
- Backend test run: `dotnet test tests/<Project> --filter <ClassName>`. Frontend test run: `npm run test -- <path>` (vitest).

## Review Focus

- **Reseeding the catalog silently erases an admin-assigned guide.** `CatalogSeeder` re-runs `Product.UpdateCatalogInfo` on every existing row; if it always passes `activationGuideId: null`, running `--seed-catalog` after an admin has linked a guide would wipe that link. Task 9 pins this with a test that reseeds an existing product and asserts its `ActivationGuideId` survives.
- **Deleting a guide still linked to a product must not leave a dangling FK.** Task 4's `DeleteGuide` must check `Products.AnyAsync(p => p.ActivationGuideId == id)` and throw `DomainConflictException` (→ 409) instead of deleting. Task 4's tests cover both the referenced-guide-is-blocked case and the unreferenced-guide-deletes case.
- **A product whose linked guide was later deleted (pre-409-guard data, or a future backdoor) must not crash the product page.** `GetProductBySlug` (Task 8) resolves the guide slug via `SingleOrDefaultAsync`, not `SingleAsync` — a missing guide id just yields `activationGuideSlug: null` rather than a 500.
- **An unknown `/article/{slug}` must 404 cleanly**, not render a blank page or throw unhandled — Task 17 mirrors `pages/product/[slug].vue`'s existing `createError({ statusCode: 404, ... })` pattern exactly.
- **A lowercase-only, non-empty slug invariant must hold for guides same as products** (admin can type anything into the slug field) — Task 1's domain tests cover empty and mixed-case slugs on both `ActivationGuide`'s constructor and its `Update` method (unlike `Product`, `Update` here also changes the slug — see Task 1's `Update`).

---

## Backend (`maxkeys`)

### Task 1: `ActivationGuide` domain entity

**Files:**
- Create: `src/Maxkeys.Domain/Guides/ActivationGuide.cs`
- Test: `tests/Maxkeys.Domain.Tests/Guides/ActivationGuideTests.cs`

**Interfaces:**
- Produces: `ActivationGuide(string slug, string title, string? contentMarkdown = null)`, `.Slug`, `.Title`, `.ContentMarkdown` (all `get; private set;`), `.Update(string slug, string title, string? contentMarkdown)`.

- [ ] **Step 1: Write the failing domain tests**

```csharp
using Maxkeys.Domain.Common;
using Maxkeys.Domain.Guides;

namespace Maxkeys.Domain.Tests.Guides;

public class ActivationGuideTests
{
    [Fact]
    public void Constructor_WithValidData_CreatesGuide()
    {
        var guide = new ActivationGuide("microsoft-gift-card-activation", "Cómo activar tu Microsoft Gift Card", "## Paso 1");

        Assert.Equal("microsoft-gift-card-activation", guide.Slug);
        Assert.Equal("Cómo activar tu Microsoft Gift Card", guide.Title);
        Assert.Equal("## Paso 1", guide.ContentMarkdown);
    }

    [Fact]
    public void Constructor_WithNoContent_DefaultsToEmptyString()
    {
        var guide = new ActivationGuide("slug", "Title");

        Assert.Equal(string.Empty, guide.ContentMarkdown);
    }

    [Fact]
    public void Constructor_WithEmptySlug_Throws()
    {
        Assert.Throws<DomainException>(() => new ActivationGuide("", "Title"));
    }

    [Fact]
    public void Constructor_WithUppercaseSlug_Throws()
    {
        Assert.Throws<DomainException>(() => new ActivationGuide("Microsoft-Guide", "Title"));
    }

    [Fact]
    public void Constructor_WithEmptyTitle_Throws()
    {
        Assert.Throws<DomainException>(() => new ActivationGuide("slug", ""));
    }

    [Fact]
    public void Update_WithValidData_ReplacesAllFields()
    {
        var guide = new ActivationGuide("slug", "Title", "Old content");

        guide.Update("new-slug", "New Title", "New content");

        Assert.Equal("new-slug", guide.Slug);
        Assert.Equal("New Title", guide.Title);
        Assert.Equal("New content", guide.ContentMarkdown);
    }

    [Fact]
    public void Update_WithEmptySlug_Throws()
    {
        var guide = new ActivationGuide("slug", "Title");

        Assert.Throws<DomainException>(() => guide.Update("", "Title", null));
    }

    [Fact]
    public void Update_WithUppercaseSlug_Throws()
    {
        var guide = new ActivationGuide("slug", "Title");

        Assert.Throws<DomainException>(() => guide.Update("Slug", "Title", null));
    }

    [Fact]
    public void Update_WithEmptyTitle_Throws()
    {
        var guide = new ActivationGuide("slug", "Title");

        Assert.Throws<DomainException>(() => guide.Update("slug", "", null));
    }

    [Fact]
    public void Update_WithNullContent_SetsEmptyString()
    {
        var guide = new ActivationGuide("slug", "Title", "content");

        guide.Update("slug", "Title", null);

        Assert.Equal(string.Empty, guide.ContentMarkdown);
    }
}
```

- [ ] **Step 2: Run to verify it fails**

Run: `dotnet test tests/Maxkeys.Domain.Tests --filter ActivationGuideTests`
Expected: build failure — `ActivationGuide` does not exist.

- [ ] **Step 3: Implement the entity**

```csharp
using Maxkeys.Domain.Common;

namespace Maxkeys.Domain.Guides;

/// <summary>
/// A reusable, admin-authored activation guide page (activation-guides spec).
/// Rendered standalone at <c>/article/{Slug}</c> on the storefront and referenced
/// by zero or more <see cref="Domain.Catalog.Product"/> rows via
/// <c>Product.ActivationGuideId</c> — the same guide can be linked from many
/// products (e.g. every Microsoft gift card), so there is no back-reference here.
/// Unlike <c>Product</c>, there is no seeder upsert-by-slug path pinning the slug,
/// so <see cref="Update"/> is free to change it too.
/// </summary>
public sealed class ActivationGuide : Entity
{
    public string Slug { get; private set; }
    public string Title { get; private set; }
    public string ContentMarkdown { get; private set; }

    public ActivationGuide(string slug, string title, string? contentMarkdown = null)
    {
        ValidateSlug(slug);
        ValidateTitle(title);

        Slug = slug;
        Title = title;
        ContentMarkdown = contentMarkdown ?? string.Empty;
    }

    public void Update(string slug, string title, string? contentMarkdown)
    {
        ValidateSlug(slug);
        ValidateTitle(title);

        Slug = slug;
        Title = title;
        ContentMarkdown = contentMarkdown ?? string.Empty;
    }

    private static void ValidateSlug(string slug)
    {
        if (string.IsNullOrWhiteSpace(slug))
        {
            throw new DomainException("Guide slug must not be empty.");
        }

        if (slug != slug.ToLowerInvariant())
        {
            throw new DomainException("Guide slug must be lowercase.");
        }
    }

    private static void ValidateTitle(string title)
    {
        if (string.IsNullOrWhiteSpace(title))
        {
            throw new DomainException("Guide title must not be empty.");
        }
    }
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `dotnet test tests/Maxkeys.Domain.Tests --filter ActivationGuideTests`
Expected: PASS (9 tests)

- [ ] **Step 5: Commit**

```bash
git add src/Maxkeys.Domain/Guides/ActivationGuide.cs tests/Maxkeys.Domain.Tests/Guides/ActivationGuideTests.cs
git commit -m "feat(guides): add ActivationGuide domain entity"
```

---

### Task 2: `Product` entity — replace `ActivationGuide` text with `ActivationGuideId`

**Files:**
- Modify: `src/Maxkeys.Domain/Catalog/Product.cs`
- Modify: `tests/Maxkeys.Domain.Tests/Catalog/ProductTests.cs`

**Interfaces:**
- Produces: `Product` constructor param `Guid? activationGuideId` (was `string? activationGuide`), `Product.ActivationGuideId` (`Guid?`, was `ActivationGuide` `string?`), `UpdateCatalogInfo(..., Guid? activationGuideId, ...)`.

- [ ] **Step 1: Read the existing test file to find every `activationGuide` reference**

Run: `dotnet test tests/Maxkeys.Domain.Tests --filter ProductTests` (baseline PASS before editing) and open `tests/Maxkeys.Domain.Tests/Catalog/ProductTests.cs` to find any assertion touching `product.ActivationGuide` or a constructor call passing a string in that position.

- [ ] **Step 2: Update `Product.cs`**

In `src/Maxkeys.Domain/Catalog/Product.cs`, replace:

```csharp
    public string? ActivationGuide { get; private set; }
```

with:

```csharp
    public Guid? ActivationGuideId { get; private set; }
```

Replace every constructor/`UpdateCatalogInfo` parameter `string? activationGuide` with `Guid? activationGuideId`, and every assignment `ActivationGuide = activationGuide;` with `ActivationGuideId = activationGuideId;` (two call sites: the constructor and `UpdateCatalogInfo`).

- [ ] **Step 3: Update any `ProductTests.cs` call sites**

Any `new Product(..., activationGuide: "...")` or positional string argument in that slot becomes `activationGuideId: Guid.NewGuid()` (or `null`); any `Assert.Equal("...", product.ActivationGuide)` becomes `Assert.Equal(guideId, product.ActivationGuideId)`.

- [ ] **Step 4: Run to verify it passes**

Run: `dotnet test tests/Maxkeys.Domain.Tests --filter ProductTests`
Expected: PASS. (This step will also surface every other project that fails to compile because of the signature change — do not fix those here, Tasks 3–7 own them.)

- [ ] **Step 5: Commit**

```bash
git add src/Maxkeys.Domain/Catalog/Product.cs tests/Maxkeys.Domain.Tests/Catalog/ProductTests.cs
git commit -m "feat(catalog): replace Product.ActivationGuide text with ActivationGuideId reference"
```

---

### Task 3: Persistence — `ActivationGuide` EF mapping, `Product.ActivationGuideId` column, migration

**Files:**
- Create: `src/Maxkeys.Infrastructure/Persistence/Configurations/ActivationGuideConfiguration.cs`
- Modify: `src/Maxkeys.Infrastructure/Persistence/Configurations/ProductConfiguration.cs`
- Modify: `src/Maxkeys.Application/Persistence/IAppDbContext.cs`
- Modify: `src/Maxkeys.Infrastructure/Persistence/AppDbContext.cs`
- Create (generated): `src/Maxkeys.Infrastructure/Persistence/Migrations/<timestamp>_AddActivationGuides.cs` + `.Designer.cs`

**Interfaces:**
- Consumes: `ActivationGuide` (Task 1), `Product.ActivationGuideId` (Task 2).
- Produces: `IAppDbContext.ActivationGuides` (`DbSet<ActivationGuide>`), `guides` table, `products.activation_guide_id` column (nullable, indexed), `products.activation_guide` column dropped.

- [ ] **Step 1: Add the EF configuration for `ActivationGuide`**

```csharp
using Maxkeys.Domain.Guides;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Maxkeys.Infrastructure.Persistence.Configurations;

/// <summary>activation-guides spec: UNIQUE(slug).</summary>
public sealed class ActivationGuideConfiguration : IEntityTypeConfiguration<ActivationGuide>
{
    public void Configure(EntityTypeBuilder<ActivationGuide> builder)
    {
        builder.HasKey(g => g.Id);

        builder.Property(g => g.Slug).HasMaxLength(200).IsRequired();
        builder.Property(g => g.Title).HasMaxLength(200).IsRequired();
        builder.Property(g => g.ContentMarkdown).HasColumnType("text").IsRequired();

        builder.HasIndex(g => g.Slug).IsUnique();
    }
}
```

- [ ] **Step 2: Update `ProductConfiguration.cs`**

Replace:

```csharp
        builder.Property(p => p.ActivationGuide).HasColumnType("text");
```

with:

```csharp
        builder.Property(p => p.ActivationGuideId);

        builder.HasIndex(p => p.ActivationGuideId);
```

- [ ] **Step 3: Add `ActivationGuides` to `IAppDbContext`**

In `src/Maxkeys.Application/Persistence/IAppDbContext.cs`, add `using Maxkeys.Domain.Guides;` and, alongside `DbSet<Product> Products { get; }`:

```csharp
    DbSet<ActivationGuide> ActivationGuides { get; }
```

- [ ] **Step 4: Add the `DbSet` to `AppDbContext`**

In `src/Maxkeys.Infrastructure/Persistence/AppDbContext.cs`, add `using Maxkeys.Domain.Guides;` and, alongside `Products`:

```csharp
    public DbSet<ActivationGuide> ActivationGuides => Set<ActivationGuide>();
```

`OnModelCreating` already calls `ApplyConfigurationsFromAssembly`, so `ActivationGuideConfiguration` is picked up automatically — no further wiring needed there.

- [ ] **Step 5: Generate the migration**

Run:
```bash
cd C:\Personal\Projects\maxkeys
dotnet ef migrations add AddActivationGuides --project src/Maxkeys.Infrastructure --startup-project src/Maxkeys.Api --output-dir Persistence/Migrations
```
Expected: a new `<timestamp>_AddActivationGuides.cs` that creates table `guides` and, on `products`, drops column `activation_guide` and adds nullable `activation_guide_id` (uuid) with an index. Open the generated file and confirm both changes are present — if `dotnet build` failed first (because Tasks 4–7 haven't updated their call sites yet), come back to this step after Task 7 instead; the model changes from Steps 1–4 are what the migration needs, not a green build of the whole solution.

- [ ] **Step 6: Commit**

```bash
git add src/Maxkeys.Infrastructure/Persistence/Configurations/ActivationGuideConfiguration.cs src/Maxkeys.Infrastructure/Persistence/Configurations/ProductConfiguration.cs src/Maxkeys.Application/Persistence/IAppDbContext.cs src/Maxkeys.Infrastructure/Persistence/AppDbContext.cs src/Maxkeys.Infrastructure/Persistence/Migrations/
git commit -m "feat(guides): add ActivationGuide persistence and Product FK migration"
```

---

### Task 4: `ActivationGuide` application use cases (list/create/update/delete) + DTO

**Files:**
- Create: `src/Maxkeys.Application/Guides/GuideDtos.cs`
- Create: `src/Maxkeys.Application/Guides/ListGuides.cs`
- Create: `src/Maxkeys.Application/Guides/CreateGuide.cs`
- Create: `src/Maxkeys.Application/Guides/UpdateGuide.cs`
- Create: `src/Maxkeys.Application/Guides/DeleteGuide.cs`
- Create: `src/Maxkeys.Application/Guides/GetGuideBySlug.cs`
- Test: `tests/Maxkeys.Application.Tests/Guides/GuideTestData.cs`
- Test: `tests/Maxkeys.Application.Tests/Guides/ListGuidesTests.cs`
- Test: `tests/Maxkeys.Application.Tests/Guides/CreateGuideTests.cs`
- Test: `tests/Maxkeys.Application.Tests/Guides/UpdateGuideTests.cs`
- Test: `tests/Maxkeys.Application.Tests/Guides/DeleteGuideTests.cs`
- Test: `tests/Maxkeys.Application.Tests/Guides/GetGuideBySlugTests.cs`

**Interfaces:**
- Consumes: `IAppDbContext.ActivationGuides`/`.Products` (Task 3), `ActivationGuide` (Task 1).
- Produces: `GuideDto(Guid Id, string Slug, string Title, string ContentMarkdown)`; `ListGuides.ExecuteAsync()`, `CreateGuide.ExecuteAsync(string slug, string title, string? contentMarkdown, CancellationToken)`, `UpdateGuide.ExecuteAsync(Guid id, string slug, string title, string? contentMarkdown, CancellationToken)`, `DeleteGuide.ExecuteAsync(Guid id, CancellationToken)` → `bool`, `GetGuideBySlug.ExecuteAsync(string slug, CancellationToken)`.

- [ ] **Step 1: Write the failing test data helper and tests**

```csharp
// tests/Maxkeys.Application.Tests/Guides/GuideTestData.cs
using Maxkeys.Domain.Guides;
using Maxkeys.Infrastructure.Persistence;

namespace Maxkeys.Application.Tests.Guides;

internal static class GuideTestData
{
    public static string UniqueSlug() => $"guide-{Guid.NewGuid():N}";

    public static ActivationGuide SeedGuide(AppDbContext context, string? slug = null, string title = "Guide", string contentMarkdown = "content")
    {
        var guide = new ActivationGuide(slug ?? UniqueSlug(), title, contentMarkdown);
        context.ActivationGuides.Add(guide);
        return guide;
    }
}
```

```csharp
// tests/Maxkeys.Application.Tests/Guides/CreateGuideTests.cs
using Maxkeys.Application.Guides;
using Maxkeys.Application.Tests.Fixtures;
using Maxkeys.Domain.Common;

namespace Maxkeys.Application.Tests.Guides;

[Collection(PostgresCollection.Name)]
public sealed class CreateGuideTests
{
    private readonly PostgresFixture _fixture;

    public CreateGuideTests(PostgresFixture fixture)
    {
        _fixture = fixture;
    }

    [Fact]
    public async Task Creates_a_guide_with_a_unique_slug()
    {
        await using var context = _fixture.CreateContext();
        var sut = new CreateGuide(context);

        var guide = await sut.ExecuteAsync(GuideTestData.UniqueSlug(), "Cómo activar", "## Paso 1");

        Assert.Equal("Cómo activar", guide.Title);
        await using var verify = _fixture.CreateContext();
        Assert.NotNull(await verify.ActivationGuides.FindAsync(guide.Id));
    }

    [Fact]
    public async Task Rejects_a_duplicate_slug_with_domain_conflict()
    {
        var slug = GuideTestData.UniqueSlug();
        await using (var seed = _fixture.CreateContext())
        {
            GuideTestData.SeedGuide(seed, slug);
            await seed.SaveChangesAsync();
        }

        await using var context = _fixture.CreateContext();
        var sut = new CreateGuide(context);

        await Assert.ThrowsAsync<DomainConflictException>(() => sut.ExecuteAsync(slug, "Other title", null));
    }
}
```

```csharp
// tests/Maxkeys.Application.Tests/Guides/UpdateGuideTests.cs
using Maxkeys.Application.Guides;
using Maxkeys.Application.Tests.Fixtures;
using Maxkeys.Domain.Common;

namespace Maxkeys.Application.Tests.Guides;

[Collection(PostgresCollection.Name)]
public sealed class UpdateGuideTests
{
    private readonly PostgresFixture _fixture;

    public UpdateGuideTests(PostgresFixture fixture)
    {
        _fixture = fixture;
    }

    [Fact]
    public async Task Updates_title_and_content()
    {
        Guid id;
        await using (var seed = _fixture.CreateContext())
        {
            var guide = GuideTestData.SeedGuide(seed);
            id = guide.Id;
            await seed.SaveChangesAsync();
        }

        await using var context = _fixture.CreateContext();
        var sut = new UpdateGuide(context);

        var updated = await sut.ExecuteAsync(id, GuideTestData.UniqueSlug(), "New title", "New content");

        Assert.Equal("New title", updated!.Title);
    }

    [Fact]
    public async Task Returns_null_for_unknown_id()
    {
        await using var context = _fixture.CreateContext();
        var sut = new UpdateGuide(context);

        var updated = await sut.ExecuteAsync(Guid.NewGuid(), GuideTestData.UniqueSlug(), "Title", null);

        Assert.Null(updated);
    }

    [Fact]
    public async Task Rejects_a_slug_already_used_by_another_guide()
    {
        var takenSlug = GuideTestData.UniqueSlug();
        Guid id;
        await using (var seed = _fixture.CreateContext())
        {
            GuideTestData.SeedGuide(seed, takenSlug);
            var guide = GuideTestData.SeedGuide(seed);
            id = guide.Id;
            await seed.SaveChangesAsync();
        }

        await using var context = _fixture.CreateContext();
        var sut = new UpdateGuide(context);

        await Assert.ThrowsAsync<DomainConflictException>(() => sut.ExecuteAsync(id, takenSlug, "Title", null));
    }
}
```

```csharp
// tests/Maxkeys.Application.Tests/Guides/DeleteGuideTests.cs
using Maxkeys.Application.Catalog;
using Maxkeys.Application.Guides;
using Maxkeys.Application.Tests.Catalog;
using Maxkeys.Application.Tests.Fixtures;
using Maxkeys.Domain.Common;

namespace Maxkeys.Application.Tests.Guides;

[Collection(PostgresCollection.Name)]
public sealed class DeleteGuideTests
{
    private readonly PostgresFixture _fixture;

    public DeleteGuideTests(PostgresFixture fixture)
    {
        _fixture = fixture;
    }

    [Fact]
    public async Task Deletes_an_unreferenced_guide()
    {
        Guid id;
        await using (var seed = _fixture.CreateContext())
        {
            var guide = GuideTestData.SeedGuide(seed);
            id = guide.Id;
            await seed.SaveChangesAsync();
        }

        await using var context = _fixture.CreateContext();
        var sut = new DeleteGuide(context);

        var deleted = await sut.ExecuteAsync(id);

        Assert.True(deleted);
        await using var verify = _fixture.CreateContext();
        Assert.Null(await verify.ActivationGuides.FindAsync(id));
    }

    [Fact]
    public async Task Returns_false_for_unknown_id()
    {
        await using var context = _fixture.CreateContext();
        var sut = new DeleteGuide(context);

        var deleted = await sut.ExecuteAsync(Guid.NewGuid());

        Assert.False(deleted);
    }

    /// <summary>Review Focus: a guide still linked from a product must not be deletable out from under it.</summary>
    [Fact]
    public async Task Rejects_deleting_a_guide_still_referenced_by_a_product()
    {
        Guid guideId;
        await using (var seed = _fixture.CreateContext())
        {
            var guide = GuideTestData.SeedGuide(seed);
            guideId = guide.Id;
            var product = CatalogTestData.SeedProduct(seed, CatalogTestData.UniquePlatform(), isActive: true);
            product.UpdateCatalogInfo(product.Name, product.Platform, product.Description, product.ImageKey, product.DetailImageKey, product.IsActive, guideId, product.ActivationType);
            await seed.SaveChangesAsync();
        }

        await using var context = _fixture.CreateContext();
        var sut = new DeleteGuide(context);

        await Assert.ThrowsAsync<DomainConflictException>(() => sut.ExecuteAsync(guideId));

        await using var verify = _fixture.CreateContext();
        Assert.NotNull(await verify.ActivationGuides.FindAsync(guideId));
    }
}
```

```csharp
// tests/Maxkeys.Application.Tests/Guides/ListGuidesTests.cs
using Maxkeys.Application.Guides;
using Maxkeys.Application.Tests.Fixtures;

namespace Maxkeys.Application.Tests.Guides;

[Collection(PostgresCollection.Name)]
public sealed class ListGuidesTests
{
    private readonly PostgresFixture _fixture;

    public ListGuidesTests(PostgresFixture fixture)
    {
        _fixture = fixture;
    }

    [Fact]
    public async Task Lists_every_guide()
    {
        await using (var seed = _fixture.CreateContext())
        {
            GuideTestData.SeedGuide(seed, title: "B");
            GuideTestData.SeedGuide(seed, title: "A");
            await seed.SaveChangesAsync();
        }

        await using var context = _fixture.CreateContext();
        var sut = new ListGuides(context);

        var guides = await sut.ExecuteAsync();

        Assert.True(guides.Count >= 2);
        Assert.Contains(guides, g => g.Title == "A");
        Assert.Contains(guides, g => g.Title == "B");
    }
}
```

```csharp
// tests/Maxkeys.Application.Tests/Guides/GetGuideBySlugTests.cs
using Maxkeys.Application.Guides;
using Maxkeys.Application.Tests.Fixtures;

namespace Maxkeys.Application.Tests.Guides;

[Collection(PostgresCollection.Name)]
public sealed class GetGuideBySlugTests
{
    private readonly PostgresFixture _fixture;

    public GetGuideBySlugTests(PostgresFixture fixture)
    {
        _fixture = fixture;
    }

    [Fact]
    public async Task Returns_the_guide_for_a_known_slug()
    {
        var slug = GuideTestData.UniqueSlug();
        await using (var seed = _fixture.CreateContext())
        {
            GuideTestData.SeedGuide(seed, slug, title: "Título");
            await seed.SaveChangesAsync();
        }

        await using var context = _fixture.CreateContext();
        var sut = new GetGuideBySlug(context);

        var guide = await sut.ExecuteAsync(slug);

        Assert.Equal("Título", guide!.Title);
    }

    [Fact]
    public async Task Returns_null_for_unknown_slug()
    {
        await using var context = _fixture.CreateContext();
        var sut = new GetGuideBySlug(context);

        Assert.Null(await sut.ExecuteAsync("unknown-slug"));
    }
}
```

- [ ] **Step 2: Run to verify they fail**

Run: `dotnet test tests/Maxkeys.Application.Tests --filter "FullyQualifiedName~Guides"`
Expected: build failure — none of the use-case classes exist yet.

- [ ] **Step 3: Implement the DTO and use cases**

```csharp
// src/Maxkeys.Application/Guides/GuideDtos.cs
namespace Maxkeys.Application.Guides;

/// <summary>
/// An activation guide (activation-guides spec). One shape serves the admin list/create/update
/// responses and the public `GET /guides/{slug}` response — there is no draft/published split
/// that would otherwise give the two views different fields.
/// </summary>
public sealed record GuideDto(Guid Id, string Slug, string Title, string ContentMarkdown);
```

```csharp
// src/Maxkeys.Application/Guides/ListGuides.cs
using Maxkeys.Application.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Maxkeys.Application.Guides;

/// <summary>Lists every activation guide for the admin picker (activation-guides spec). One class per use case (ADR-02).</summary>
public sealed class ListGuides
{
    private readonly IAppDbContext _db;

    public ListGuides(IAppDbContext db)
    {
        _db = db;
    }

    public async Task<IReadOnlyList<GuideDto>> ExecuteAsync(CancellationToken cancellationToken = default) =>
        await _db.ActivationGuides
            .OrderBy(g => g.Title)
            .Select(g => new GuideDto(g.Id, g.Slug, g.Title, g.ContentMarkdown))
            .ToListAsync(cancellationToken);
}
```

```csharp
// src/Maxkeys.Application/Guides/CreateGuide.cs
using Maxkeys.Application.Persistence;
using Maxkeys.Domain.Common;
using Maxkeys.Domain.Guides;
using Microsoft.EntityFrameworkCore;

namespace Maxkeys.Application.Guides;

/// <summary>Creates a new activation guide. Throws <see cref="DomainConflictException"/> (409) for a duplicate slug. One class per use case (ADR-02).</summary>
public sealed class CreateGuide
{
    private readonly IAppDbContext _db;

    public CreateGuide(IAppDbContext db)
    {
        _db = db;
    }

    public async Task<GuideDto> ExecuteAsync(string slug, string title, string? contentMarkdown, CancellationToken cancellationToken = default)
    {
        var slugTaken = await _db.ActivationGuides.AnyAsync(g => g.Slug == slug, cancellationToken);
        if (slugTaken)
        {
            throw new DomainConflictException($"A guide with slug '{slug}' already exists.");
        }

        var guide = new ActivationGuide(slug, title, contentMarkdown);
        _db.ActivationGuides.Add(guide);
        await _db.SaveChangesAsync(cancellationToken);

        return new GuideDto(guide.Id, guide.Slug, guide.Title, guide.ContentMarkdown);
    }
}
```

```csharp
// src/Maxkeys.Application/Guides/UpdateGuide.cs
using Maxkeys.Application.Persistence;
using Maxkeys.Domain.Common;
using Microsoft.EntityFrameworkCore;

namespace Maxkeys.Application.Guides;

/// <summary>Updates an activation guide's slug/title/content. Returns null for an unknown id (→ 404). Throws <see cref="DomainConflictException"/> (409) if the slug is taken by another guide. One class per use case (ADR-02).</summary>
public sealed class UpdateGuide
{
    private readonly IAppDbContext _db;

    public UpdateGuide(IAppDbContext db)
    {
        _db = db;
    }

    public async Task<GuideDto?> ExecuteAsync(Guid id, string slug, string title, string? contentMarkdown, CancellationToken cancellationToken = default)
    {
        var guide = await _db.ActivationGuides.SingleOrDefaultAsync(g => g.Id == id, cancellationToken);
        if (guide is null)
        {
            return null;
        }

        var slugTaken = await _db.ActivationGuides.AnyAsync(g => g.Id != id && g.Slug == slug, cancellationToken);
        if (slugTaken)
        {
            throw new DomainConflictException($"A guide with slug '{slug}' already exists.");
        }

        guide.Update(slug, title, contentMarkdown);
        await _db.SaveChangesAsync(cancellationToken);

        return new GuideDto(guide.Id, guide.Slug, guide.Title, guide.ContentMarkdown);
    }
}
```

```csharp
// src/Maxkeys.Application/Guides/DeleteGuide.cs
using Maxkeys.Application.Persistence;
using Maxkeys.Domain.Common;
using Microsoft.EntityFrameworkCore;

namespace Maxkeys.Application.Guides;

/// <summary>
/// Hard-deletes an activation guide (unlike <c>Product</c>'s soft delete — a guide carries no
/// order-history reference to preserve). Throws <see cref="DomainConflictException"/> (409) when
/// any product still references it, so a product's FK is never left dangling. One class per use
/// case (ADR-02).
/// </summary>
public sealed class DeleteGuide
{
    private readonly IAppDbContext _db;

    public DeleteGuide(IAppDbContext db)
    {
        _db = db;
    }

    public async Task<bool> ExecuteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var guide = await _db.ActivationGuides.SingleOrDefaultAsync(g => g.Id == id, cancellationToken);
        if (guide is null)
        {
            return false;
        }

        var referenced = await _db.Products.AnyAsync(p => p.ActivationGuideId == id, cancellationToken);
        if (referenced)
        {
            throw new DomainConflictException("This guide is still linked to at least one product.");
        }

        _db.ActivationGuides.Remove(guide);
        await _db.SaveChangesAsync(cancellationToken);
        return true;
    }
}
```

```csharp
// src/Maxkeys.Application/Guides/GetGuideBySlug.cs
using Maxkeys.Application.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Maxkeys.Application.Guides;

/// <summary>Public lookup for the storefront `/article/{slug}` page. One class per use case (ADR-02).</summary>
public sealed class GetGuideBySlug
{
    private readonly IAppDbContext _db;

    public GetGuideBySlug(IAppDbContext db)
    {
        _db = db;
    }

    public async Task<GuideDto?> ExecuteAsync(string slug, CancellationToken cancellationToken = default) =>
        await _db.ActivationGuides
            .Where(g => g.Slug == slug)
            .Select(g => new GuideDto(g.Id, g.Slug, g.Title, g.ContentMarkdown))
            .SingleOrDefaultAsync(cancellationToken);
}
```

- [ ] **Step 4: Run to verify they pass**

Run: `dotnet test tests/Maxkeys.Application.Tests --filter "FullyQualifiedName~Guides"`
Expected: PASS (11 tests)

- [ ] **Step 5: Commit**

```bash
git add src/Maxkeys.Application/Guides/ tests/Maxkeys.Application.Tests/Guides/
git commit -m "feat(guides): add guide list/create/update/delete/get use cases"
```

---

### Task 5: Update `Product` application use cases for `ActivationGuideId`/`ActivationGuideSlug`

**Files:**
- Modify: `src/Maxkeys.Application/Catalog/AdminCatalogDtos.cs`
- Modify: `src/Maxkeys.Application/Catalog/CatalogDtos.cs`
- Modify: `src/Maxkeys.Application/Catalog/CreateProduct.cs`
- Modify: `src/Maxkeys.Application/Catalog/UpdateProduct.cs`
- Modify: `src/Maxkeys.Application/Catalog/ListAdminProducts.cs`
- Modify: `src/Maxkeys.Application/Catalog/GetProductBySlug.cs`
- Modify: `tests/Maxkeys.Application.Tests/Catalog/*` (any test asserting on `.ActivationGuide`)

**Interfaces:**
- Consumes: `Product.ActivationGuideId` (Task 2), `IAppDbContext.ActivationGuides` (Task 3).
- Produces: `AdminProduct.ActivationGuideId` (`Guid?`), `ProductDetail.ActivationGuideSlug` (`string?`).

- [ ] **Step 1: Update `AdminCatalogDtos.cs`**

In `AdminProduct`, replace:

```csharp
    string? ActivationGuide,
```

with:

```csharp
    Guid? ActivationGuideId,
```

- [ ] **Step 2: Update `CatalogDtos.cs`**

In `ProductDetail`, replace:

```csharp
    string? ActivationGuide,
```

with:

```csharp
    string? ActivationGuideSlug,
```

- [ ] **Step 3: Update `CreateProduct.cs` and `UpdateProduct.cs`**

In both files, rename every `string? activationGuide` parameter to `Guid? activationGuideId`, and pass it straight through to `new Product(...)` / `UpdateCatalogInfo(...)` unchanged in position.

- [ ] **Step 4: Update `ListAdminProducts.cs`'s `ToAdminProduct` mapper**

Replace:

```csharp
            product.ActivationGuide,
```

with:

```csharp
            product.ActivationGuideId,
```

- [ ] **Step 5: Update `GetProductBySlug.cs` to resolve the guide's slug**

Replace the method body's guide-independent construction with a guide lookup before building `ProductDetail`:

```csharp
        var activationGuideSlug = product.ActivationGuideId is { } guideId
            ? await _db.ActivationGuides
                .Where(g => g.Id == guideId)
                .Select(g => g.Slug)
                .SingleOrDefaultAsync(cancellationToken)
            : null;

        return new ProductDetail(
            product.Id,
            product.Slug,
            product.Name,
            product.Platform,
            mainImageUrl,
            _imageUrlBuilder.Build(product.DetailImageKey),
            displayVariant?.Price ?? 0m,
            displayVariant is null ? null : VariantPricing.ComputeOldPrice(displayVariant.Price, displayVariant.DiscountPercentage),
            product.Description,
            variants.Select(ToVariantDetail).ToList(),
            galleryUrls,
            activationGuideSlug,
            product.ActivationType);
```

`SingleOrDefaultAsync` (not `SingleAsync`) here is deliberate — Review Focus: a product's `ActivationGuideId` pointing at a guide that no longer exists must degrade to `null`, not throw.

- [ ] **Step 6: Fix every failing test in `tests/Maxkeys.Application.Tests/Catalog/`**

Run: `dotnet test tests/Maxkeys.Application.Tests --filter "FullyQualifiedName~Catalog"` and fix each compile error — every `activationGuide: "..."` argument becomes `activationGuideId: Guid.NewGuid()` (or `null`), and every `Assert.Equal("...", x.ActivationGuide)` becomes the `Guid?`/slug equivalent for whichever DTO the test is asserting on.

- [ ] **Step 7: Run to verify it passes**

Run: `dotnet test tests/Maxkeys.Application.Tests --filter "FullyQualifiedName~Catalog"`
Expected: PASS

- [ ] **Step 8: Commit**

```bash
git add src/Maxkeys.Application/Catalog/ tests/Maxkeys.Application.Tests/Catalog/
git commit -m "feat(catalog): thread ActivationGuideId/ActivationGuideSlug through product use cases"
```

---

### Task 6: `AdminGuidesEndpoints` + public `GET /guides/{slug}` + DI + routing

**Files:**
- Create: `src/Maxkeys.Api/Endpoints/AdminGuidesEndpoints.cs`
- Create: `src/Maxkeys.Api/Endpoints/GuideEndpoints.cs`
- Modify: `src/Maxkeys.Infrastructure/DependencyInjection.cs`
- Modify: `src/Maxkeys.Api/Program.cs`
- Test: `tests/Maxkeys.Api.Tests/Admin/AdminGuidesEndpointsTests.cs`
- Test: `tests/Maxkeys.Api.Tests/GuideEndpointsTests.cs`

**Interfaces:**
- Consumes: `ListGuides`, `CreateGuide`, `UpdateGuide`, `DeleteGuide`, `GetGuideBySlug` (Task 4).
- Produces: `MapAdminGuidesEndpoints()`, `MapGuideEndpoints()`, `GuideRequest(string Slug, string Title, string? ContentMarkdown)`.

- [ ] **Step 1: Write the failing endpoint tests**

```csharp
// tests/Maxkeys.Api.Tests/Admin/AdminGuidesEndpointsTests.cs
using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using Maxkeys.Api.Tests.Auth;
using Maxkeys.Application.Guides;
using Maxkeys.Domain.Guides;
using Maxkeys.Infrastructure.Persistence;
using Microsoft.Extensions.DependencyInjection;

namespace Maxkeys.Api.Tests.Admin;

[Collection(Hs256ApiCollection.Name)]
public sealed class AdminGuidesEndpointsTests
{
    private const string NonAdminSub = "44444444-4444-4444-4444-444444444444";

    private readonly Hs256ApiTestFixture _factory;

    public AdminGuidesEndpointsTests(Hs256ApiTestFixture factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task Anonymous_request_to_list_is_rejected()
    {
        var response = await _factory.CreateClient().GetAsync("/admin/guides");
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Non_admin_sub_is_forbidden_from_list()
    {
        var response = await AdminClient(NonAdminSub).GetAsync("/admin/guides");
        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task Admin_can_create_a_guide()
    {
        var slug = $"guide-{Guid.NewGuid():N}";

        var response = await AdminClient().PostAsJsonAsync("/admin/guides", new { slug, title = "Cómo activar", contentMarkdown = "## Paso 1" });

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var guide = await response.Content.ReadFromJsonAsync<GuideDto>();
        Assert.Equal(slug, guide!.Slug);
    }

    [Fact]
    public async Task Create_with_duplicate_slug_returns_409()
    {
        var slug = await SeedGuideAsync();

        var response = await AdminClient().PostAsJsonAsync("/admin/guides", new { slug, title = "Other", contentMarkdown = (string?)null });

        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
    }

    [Fact]
    public async Task Admin_can_update_a_guide()
    {
        var (id, _) = await SeedGuideWithIdAsync();

        var response = await AdminClient().PutAsJsonAsync($"/admin/guides/{id}", new { slug = $"guide-{Guid.NewGuid():N}", title = "New title", contentMarkdown = "New content" });

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var guide = await response.Content.ReadFromJsonAsync<GuideDto>();
        Assert.Equal("New title", guide!.Title);
    }

    [Fact]
    public async Task Update_with_unknown_id_returns_404()
    {
        var response = await AdminClient().PutAsJsonAsync($"/admin/guides/{Guid.NewGuid()}", new { slug = $"guide-{Guid.NewGuid():N}", title = "Title", contentMarkdown = (string?)null });

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task Admin_can_delete_an_unreferenced_guide()
    {
        var (id, _) = await SeedGuideWithIdAsync();

        var response = await AdminClient().DeleteAsync($"/admin/guides/{id}");

        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);
    }

    [Fact]
    public async Task Delete_with_unknown_id_returns_404()
    {
        var response = await AdminClient().DeleteAsync($"/admin/guides/{Guid.NewGuid()}");
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    /// <summary>Review Focus: deleting a guide still linked to a product must fail, not orphan the FK.</summary>
    [Fact]
    public async Task Delete_of_a_referenced_guide_returns_409()
    {
        var (guideId, _) = await SeedGuideWithIdAsync();
        await Seed(async db =>
        {
            var product = new Maxkeys.Domain.Catalog.Product($"p-{Guid.NewGuid():N}", "Product", $"platform-{Guid.NewGuid():N}");
            db.Products.Add(product);
            await db.SaveChangesAsync();
            product.UpdateCatalogInfo(product.Name, product.Platform, product.Description, product.ImageKey, product.DetailImageKey, product.IsActive, guideId, product.ActivationType);
            await db.SaveChangesAsync();
        });

        var response = await AdminClient().DeleteAsync($"/admin/guides/{guideId}");

        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
    }

    private async Task<string> SeedGuideAsync()
    {
        var (_, slug) = await SeedGuideWithIdAsync();
        return slug;
    }

    private async Task<(Guid Id, string Slug)> SeedGuideWithIdAsync()
    {
        Guid id = default;
        var slug = $"guide-{Guid.NewGuid():N}";
        await Seed(async db =>
        {
            var guide = new ActivationGuide(slug, "Guide", "content");
            db.ActivationGuides.Add(guide);
            await db.SaveChangesAsync();
            id = guide.Id;
        });
        return (id, slug);
    }

    private async Task Seed(Func<AppDbContext, Task> seed)
    {
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        await seed(db);
    }

    private HttpClient AdminClient(string? sub = null)
    {
        var token = TestTokens.CreateHs256(
            sub ?? Hs256ApiTestFixture.AdminSub, Hs256ApiTestFixture.Issuer, Hs256ApiTestFixture.Audience, Hs256ApiTestFixture.Hs256Secret);
        var client = _factory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
        return client;
    }
}
```

```csharp
// tests/Maxkeys.Api.Tests/GuideEndpointsTests.cs
using System.Net;
using System.Net.Http.Json;
using Maxkeys.Api.Tests.Auth;
using Maxkeys.Application.Guides;
using Maxkeys.Domain.Guides;
using Maxkeys.Infrastructure.Persistence;
using Microsoft.Extensions.DependencyInjection;

namespace Maxkeys.Api.Tests;

[Collection(Hs256ApiCollection.Name)]
public sealed class GuideEndpointsTests
{
    private readonly Hs256ApiTestFixture _factory;

    public GuideEndpointsTests(Hs256ApiTestFixture factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task Public_can_fetch_a_guide_by_slug_without_auth()
    {
        var slug = $"guide-{Guid.NewGuid():N}";
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            db.ActivationGuides.Add(new ActivationGuide(slug, "Título", "Contenido"));
            await db.SaveChangesAsync();
        }

        var response = await _factory.CreateClient().GetAsync($"/guides/{slug}");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var guide = await response.Content.ReadFromJsonAsync<GuideDto>();
        Assert.Equal("Título", guide!.Title);
    }

    [Fact]
    public async Task Unknown_slug_returns_404()
    {
        var response = await _factory.CreateClient().GetAsync("/guides/unknown-slug");
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }
}
```

- [ ] **Step 2: Run to verify they fail**

Run: `dotnet test tests/Maxkeys.Api.Tests --filter "FullyQualifiedName~Guide"`
Expected: build failure — no `/admin/guides` or `/guides/{slug}` route exists yet.

- [ ] **Step 3: Implement the endpoints**

```csharp
// src/Maxkeys.Api/Endpoints/AdminGuidesEndpoints.cs
using Maxkeys.Api.Auth;
using Maxkeys.Application.Guides;

namespace Maxkeys.Api.Endpoints;

/// <summary>Admin activation-guide management endpoints (activation-guides spec). Every route requires the <see cref="AdminPolicy.Name"/> policy.</summary>
public static class AdminGuidesEndpoints
{
    public static IEndpointRouteBuilder MapAdminGuidesEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/admin/guides").RequireAuthorization(AdminPolicy.Name);

        group.MapGet(string.Empty, async (ListGuides useCase, CancellationToken cancellationToken) =>
            Results.Ok(await useCase.ExecuteAsync(cancellationToken)));

        group.MapPost(string.Empty, async (GuideRequest body, CreateGuide useCase, CancellationToken cancellationToken) =>
        {
            var guide = await useCase.ExecuteAsync(body.Slug, body.Title, body.ContentMarkdown, cancellationToken);
            return Results.Created($"/admin/guides/{guide.Id}", guide);
        });

        group.MapPut("/{id:guid}", async (Guid id, GuideRequest body, UpdateGuide useCase, CancellationToken cancellationToken) =>
        {
            var guide = await useCase.ExecuteAsync(id, body.Slug, body.Title, body.ContentMarkdown, cancellationToken);
            return guide is null
                ? Results.Problem(statusCode: StatusCodes.Status404NotFound, title: "Guide not found")
                : Results.Ok(guide);
        });

        group.MapDelete("/{id:guid}", async (Guid id, DeleteGuide useCase, CancellationToken cancellationToken) =>
        {
            var deleted = await useCase.ExecuteAsync(id, cancellationToken);
            return deleted
                ? Results.NoContent()
                : Results.Problem(statusCode: StatusCodes.Status404NotFound, title: "Guide not found");
        });

        return app;
    }
}

/// <summary>Admin request body for <c>POST /admin/guides</c> and <c>PUT /admin/guides/{id}</c>.</summary>
public sealed record GuideRequest(string Slug, string Title, string? ContentMarkdown);
```

```csharp
// src/Maxkeys.Api/Endpoints/GuideEndpoints.cs
using Maxkeys.Application.Guides;

namespace Maxkeys.Api.Endpoints;

/// <summary>Public, unauthenticated guide lookup for the storefront `/article/{slug}` page (activation-guides spec).</summary>
public static class GuideEndpoints
{
    public static IEndpointRouteBuilder MapGuideEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapGet("/guides/{slug}", async (string slug, GetGuideBySlug useCase, CancellationToken cancellationToken) =>
        {
            var guide = await useCase.ExecuteAsync(slug, cancellationToken);
            return guide is null
                ? Results.Problem(statusCode: StatusCodes.Status404NotFound, title: "Guide not found")
                : Results.Ok(guide);
        });

        return app;
    }
}
```

- [ ] **Step 4: Register use cases in DI**

In `src/Maxkeys.Infrastructure/DependencyInjection.cs`, alongside `services.AddScoped<DeleteProductVariant>();`:

```csharp
        services.AddScoped<ListGuides>();
        services.AddScoped<CreateGuide>();
        services.AddScoped<UpdateGuide>();
        services.AddScoped<DeleteGuide>();
        services.AddScoped<GetGuideBySlug>();
```

Add `using Maxkeys.Application.Guides;` at the top if not already present via a wildcard.

- [ ] **Step 5: Wire the routes in `Program.cs`**

Alongside `app.MapAdminCatalogEndpoints();`:

```csharp
    app.MapAdminGuidesEndpoints();
```

Alongside `app.MapCatalogEndpoints();`:

```csharp
    app.MapGuideEndpoints();
```

- [ ] **Step 6: Run to verify it passes**

Run: `dotnet test tests/Maxkeys.Api.Tests --filter "FullyQualifiedName~Guide"`
Expected: PASS (11 tests)

- [ ] **Step 7: Commit**

```bash
git add src/Maxkeys.Api/Endpoints/AdminGuidesEndpoints.cs src/Maxkeys.Api/Endpoints/GuideEndpoints.cs src/Maxkeys.Infrastructure/DependencyInjection.cs src/Maxkeys.Api/Program.cs tests/Maxkeys.Api.Tests/Admin/AdminGuidesEndpointsTests.cs tests/Maxkeys.Api.Tests/GuideEndpointsTests.cs
git commit -m "feat(guides): add admin and public guide endpoints"
```

---

### Task 7: Update `AdminCatalogEndpoints` request DTOs for `ActivationGuideId`

**Files:**
- Modify: `src/Maxkeys.Api/Endpoints/AdminCatalogEndpoints.cs`
- Modify: `tests/Maxkeys.Api.Tests/Admin/AdminCatalogEndpointsTests.cs`

**Interfaces:**
- Consumes: `CreateProduct`/`UpdateProduct` with `Guid? activationGuideId` (Task 5).
- Produces: `CreateProductRequest.ActivationGuide` → `.ActivationGuideId` (`Guid?`), same for `UpdateProductRequest`.

- [ ] **Step 1: Update the request records**

In `src/Maxkeys.Api/Endpoints/AdminCatalogEndpoints.cs`, in both `CreateProductRequest` and `UpdateProductRequest`, replace:

```csharp
    string? ActivationGuide,
```

with:

```csharp
    Guid? ActivationGuideId,
```

And in the `MapPost("/products", ...)` and `MapPut("/products/{id:guid}", ...)` handler bodies, replace `body.ActivationGuide` with `body.ActivationGuideId` in the `useCase.ExecuteAsync(...)` call.

- [ ] **Step 2: Fix `AdminCatalogEndpointsTests.cs`**

Run: `dotnet test tests/Maxkeys.Api.Tests --filter AdminCatalogEndpointsTests` and fix every compile error from the renamed field — any anonymous request body with `activationGuide = "..."` becomes `activationGuideId = (Guid?)null` (or a real `Guid`), and any response assertion on `.ActivationGuide` becomes `.ActivationGuideId`.

- [ ] **Step 3: Run to verify it passes**

Run: `dotnet test tests/Maxkeys.Api.Tests --filter AdminCatalogEndpointsTests`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/Maxkeys.Api/Endpoints/AdminCatalogEndpoints.cs tests/Maxkeys.Api.Tests/Admin/AdminCatalogEndpointsTests.cs
git commit -m "feat(catalog): rename ActivationGuide to ActivationGuideId in admin catalog contract"
```

---

### Task 8: `dotnet build` sweep — catch every remaining reference

**Files:**
- Modify: whatever `dotnet build` still flags (expected: none beyond Tasks 2–7, this is a verification task).

- [ ] **Step 1: Build the whole solution**

Run: `dotnet build Maxkeys.sln`
Expected: 0 errors. If any remain, they are stray `ActivationGuide` references outside the files already touched — fix them the same way (rename to `ActivationGuideId`/`ActivationGuideSlug` per DTO).

- [ ] **Step 2: Run the full backend test suite**

Run: `dotnet test`
Expected: PASS, 0 failures.

- [ ] **Step 3: Commit (only if Step 1 required fixes)**

```bash
git add -A
git commit -m "fix(catalog): finish ActivationGuide → ActivationGuideId rename"
```

---

### Task 9: `GuideSeeder` + `seed/guides.json` + preserve `Product.ActivationGuideId` on reseed

**Files:**
- Create: `src/Maxkeys.Infrastructure/Persistence/GuideSeeder.cs`
- Create: `seed/guides.json`
- Modify: `src/Maxkeys.Infrastructure/Persistence/CatalogSeeder.cs`
- Modify: `src/Maxkeys.Api/Program.cs`
- Test: `tests/Maxkeys.Infrastructure.Tests/Persistence/GuideSeederTests.cs` (create the directory if it does not exist — check first with `ls tests/Maxkeys.Infrastructure.Tests` whether a `Persistence` folder already exists for `CatalogSeeder`'s own tests, and mirror its location)
- Test: add one case to whichever file already tests `CatalogSeeder` (search `tests/` for `CatalogSeederTests` first)

**Interfaces:**
- Consumes: `ActivationGuide` (Task 1), `AppDbContext.ActivationGuides` (Task 3).
- Produces: `GuideSeeder.SeedAsync(AppDbContext db, string jsonFilePath, CancellationToken)`.

- [ ] **Step 1: Locate the existing `CatalogSeeder` test file**

Run: `find tests -iname "*CatalogSeeder*"` (or the platform equivalent) to get its exact path and current content before editing — its seed-product builder helper needs a matching update for Step 5 below.

- [ ] **Step 2: Write the failing `GuideSeeder` test**

```csharp
// tests/Maxkeys.Infrastructure.Tests/Persistence/GuideSeederTests.cs
using Maxkeys.Infrastructure.Persistence;

namespace Maxkeys.Infrastructure.Tests.Persistence;

public sealed class GuideSeederTests
{
    [Fact]
    public async Task Inserts_a_new_guide_from_the_seed_file()
    {
        var path = Path.GetTempFileName();
        await File.WriteAllTextAsync(path, """
        { "guides": [ { "slug": "example-activation-guide", "title": "Ejemplo de guía", "contentMarkdown": "## Paso 1\n\nDescribí el primer paso acá." } ] }
        """);

        await using var context = TestDbContextFactory.Create();
        await GuideSeeder.SeedAsync(context, path);

        var guide = await context.ActivationGuides.SingleAsync(g => g.Slug == "example-activation-guide");
        Assert.Equal("Ejemplo de guía", guide.Title);
    }

    [Fact]
    public async Task Reseeding_the_same_slug_updates_in_place_without_duplicating()
    {
        var path = Path.GetTempFileName();
        await File.WriteAllTextAsync(path, """{ "guides": [ { "slug": "example-activation-guide", "title": "V1", "contentMarkdown": "v1" } ] }""");
        await using var context = TestDbContextFactory.Create();
        await GuideSeeder.SeedAsync(context, path);

        await File.WriteAllTextAsync(path, """{ "guides": [ { "slug": "example-activation-guide", "title": "V2", "contentMarkdown": "v2" } ] }""");
        await GuideSeeder.SeedAsync(context, path);

        var guides = context.ActivationGuides.Where(g => g.Slug == "example-activation-guide").ToList();
        Assert.Single(guides);
        Assert.Equal("V2", guides[0].Title);
    }
}
```

If `TestDbContextFactory` does not exist under this name, grep `tests/Maxkeys.Infrastructure.Tests` for how `CatalogSeederTests` (found in Step 1) builds its `AppDbContext` in tests and use that exact helper instead — do not invent a new one.

- [ ] **Step 3: Run to verify it fails**

Run: `dotnet test tests/Maxkeys.Infrastructure.Tests --filter GuideSeederTests`
Expected: build failure — `GuideSeeder` does not exist.

- [ ] **Step 4: Implement `GuideSeeder`**

```csharp
using System.Text.Json;
using System.Text.Json.Serialization;
using Maxkeys.Domain.Guides;
using Microsoft.EntityFrameworkCore;

namespace Maxkeys.Infrastructure.Persistence;

/// <summary>
/// Upserts operator-maintained activation guides from a JSON seed file, matched by
/// <see cref="ActivationGuide.Slug"/> (mirrors <see cref="CatalogSeeder"/>'s idempotent
/// upsert-by-slug pattern). Wired via <c>Maxkeys.Api --seed-guides &lt;path&gt;</c> (<c>Program.cs</c>).
/// Ships one example guide (<c>seed/guides.json</c>) for the admin to edit and clone from.
/// </summary>
public static class GuideSeeder
{
    private static readonly JsonSerializerOptions JsonOptions = new() { PropertyNameCaseInsensitive = true };

    public static async Task SeedAsync(AppDbContext db, string jsonFilePath, CancellationToken cancellationToken = default)
    {
        var json = await File.ReadAllTextAsync(jsonFilePath, cancellationToken);
        var document = JsonSerializer.Deserialize<GuideSeedDocument>(json, JsonOptions) ?? new GuideSeedDocument([]);

        foreach (var seedGuide in document.Guides)
        {
            var guide = await db.ActivationGuides.SingleOrDefaultAsync(g => g.Slug == seedGuide.Slug, cancellationToken);

            if (guide is null)
            {
                db.ActivationGuides.Add(new ActivationGuide(seedGuide.Slug, seedGuide.Title, seedGuide.ContentMarkdown));
            }
            else
            {
                guide.Update(seedGuide.Slug, seedGuide.Title, seedGuide.ContentMarkdown);
            }
        }

        await db.SaveChangesAsync(cancellationToken);
    }
}

internal sealed record GuideSeedDocument(List<GuideSeedItem> Guides);

internal sealed record GuideSeedItem(
    string Slug,
    string Title,
    [property: JsonPropertyName("contentMarkdown")] string? ContentMarkdown);
```

- [ ] **Step 5: Create `seed/guides.json` with one example**

```json
{
  "guides": [
    {
      "slug": "example-activation-guide",
      "title": "Ejemplo de guía de activación",
      "contentMarkdown": "## Paso 1\n\nDescribí acá el primer paso para activar el código (por ejemplo, dónde ingresarlo en la plataforma).\n\n## Paso 2\n\nAgregá el siguiente paso. Podés insertar imágenes con el botón \"Imagen\" del editor.\n\n## Paso 3\n\nCerrá con cualquier aclaración final (regiones soportadas, tiempo de acreditación, etc.)."
    }
  ]
}
```

- [ ] **Step 6: Wire `--seed-guides` in `Program.cs`**

Alongside the existing `--seed-catalog` block:

```csharp
    var seedGuidesPath = GetSeedGuidesPath(args);
    if (seedGuidesPath is not null)
    {
        using var seedGuidesScope = app.Services.CreateScope();
        var db = seedGuidesScope.ServiceProvider.GetRequiredService<AppDbContext>();
        await GuideSeeder.SeedAsync(db, seedGuidesPath);
        return;
    }
```

And alongside `GetSeedCatalogPath`:

```csharp
static string? GetSeedGuidesPath(string[] args)
{
    for (var i = 0; i < args.Length - 1; i++)
    {
        if (args[i] == "--seed-guides")
        {
            return args[i + 1];
        }
    }

    return null;
}
```

- [ ] **Step 7: Fix `CatalogSeeder` — remove `ActivationGuide` from the seed DTO, preserve existing `ActivationGuideId` on reseed**

In `CatalogSeeder.cs`, remove the `ActivationGuide` property from `CatalogSeedProduct`:

```csharp
internal sealed record CatalogSeedProduct(
    string Slug,
    string Name,
    string Platform,
    [property: JsonPropertyName("description")] string? Description,
    [property: JsonPropertyName("imageKey")] string? ImageKey,
    [property: JsonPropertyName("detailImageKey")] string? DetailImageKey,
    bool IsActive,
    List<CatalogSeedVariant> Variants,
    [property: JsonPropertyName("activationType")] string? ActivationType = null);
```

In the `foreach (var seedProduct in document.Products)` loop, the new-product branch passes `activationGuideId: null` (a freshly-seeded product has no guide until an admin assigns one):

```csharp
            if (product is null)
            {
                product = new Product(
                    seedProduct.Slug,
                    seedProduct.Name,
                    seedProduct.Platform,
                    seedProduct.IsActive,
                    seedProduct.ImageKey,
                    seedProduct.Description,
                    seedProduct.DetailImageKey,
                    activationGuideId: null,
                    seedProduct.ActivationType);
                db.Products.Add(product);
            }
            else
            {
                // Review Focus: the seed file no longer carries a guide assignment — reseeding must
                // preserve whatever ActivationGuideId an admin already set, never null it out.
                product.UpdateCatalogInfo(
                    seedProduct.Name,
                    seedProduct.Platform,
                    seedProduct.Description,
                    seedProduct.ImageKey,
                    seedProduct.DetailImageKey,
                    seedProduct.IsActive,
                    product.ActivationGuideId,
                    seedProduct.ActivationType);
            }
```

- [ ] **Step 8: Add the reseed-preserves-guide regression test to the existing `CatalogSeeder` test file found in Step 1**

Add this test (adjust the seed-file-writing helper to match whatever that file already uses):

```csharp
[Fact]
public async Task Reseeding_an_existing_product_preserves_its_admin_assigned_guide()
{
    await using var context = TestDbContextFactory.Create(); // use this file's existing DB helper
    var guide = new Maxkeys.Domain.Guides.ActivationGuide("example-activation-guide", "Guide", "content");
    context.ActivationGuides.Add(guide);
    await context.SaveChangesAsync();

    var path = Path.GetTempFileName();
    await File.WriteAllTextAsync(path, """
    { "products": [ { "slug": "steam-wallet-gift-card", "name": "Steam Wallet Gift Card", "platform": "Steam", "isActive": true, "variants": [] } ] }
    """);
    await CatalogSeeder.SeedAsync(context, path);
    var product = await context.Products.SingleAsync(p => p.Slug == "steam-wallet-gift-card");
    product.UpdateCatalogInfo(product.Name, product.Platform, product.Description, product.ImageKey, product.DetailImageKey, product.IsActive, guide.Id, product.ActivationType);
    await context.SaveChangesAsync();

    await CatalogSeeder.SeedAsync(context, path);

    var reseeded = await context.Products.SingleAsync(p => p.Slug == "steam-wallet-gift-card");
    Assert.Equal(guide.Id, reseeded.ActivationGuideId);
}
```

- [ ] **Step 9: Run to verify everything passes**

Run: `dotnet test tests/Maxkeys.Infrastructure.Tests`
Expected: PASS

- [ ] **Step 10: Commit**

```bash
git add src/Maxkeys.Infrastructure/Persistence/GuideSeeder.cs src/Maxkeys.Infrastructure/Persistence/CatalogSeeder.cs src/Maxkeys.Api/Program.cs seed/guides.json tests/Maxkeys.Infrastructure.Tests/
git commit -m "feat(guides): add GuideSeeder, seed one example guide, preserve guide links on reseed"
```

---

### Task 10: `design.md` — document the new contract

**Files:**
- Modify: `openspec/changes/mvp-marketplace/design.md`

- [ ] **Step 1: Add `ActivationGuide` to §4.1's entity table**

In the `## 4.1 Entities and invariants` table, add a row:

```
| `ActivationGuide` | `Slug` non-empty, lowercase, unique (DB); `Title` non-empty | `Update` (slug/title/content, all at once — no seeder upsert path pins the slug) |
```

- [ ] **Step 2: Add indexes to §5**

In the "Indexes and constraints" table:

```
| `guides` | `UNIQUE(slug)` | slug lookup for `/guides/{slug}` |
```

And note the `products` row now also has `INDEX(activation_guide_id)` alongside its existing entries.

- [ ] **Step 3: Add the new endpoints to §7's contract table**

Add two rows:

```
| `GET /guides/{slug}` | public | — | `200 GuideDto` `{id, slug, title, contentMarkdown}` |
| `GET /admin/guides` | bearer + Admin | — | `200 GuideDto[]` |
| `POST /admin/guides` | bearer + Admin | `{slug, title, contentMarkdown?}` | `201 GuideDto` |
| `PUT /admin/guides/{id}` | bearer + Admin | `{slug, title, contentMarkdown?}` | `200 GuideDto` |
| `DELETE /admin/guides/{id}` | bearer + Admin | — | `204` (`409` if a product still references it) |
```

Update the existing `GET /catalog/products/{slug}` row's response shape note to mention `activationGuideSlug` if it currently lists `activationGuide`.

- [ ] **Step 4: Commit**

```bash
git add openspec/changes/mvp-marketplace/design.md
git commit -m "docs: document ActivationGuide entity and endpoints in design.md"
```

---

## Frontend (`maxkeys-front`)

### Task 11: `types/api.ts` — guide DTOs, product field renames

**Files:**
- Modify: `types/api.ts`

- [ ] **Step 1: Add guide types**

Near the other DTO groups:

```typescript
// mirrors activation-guides design.md "GuideDto" (GET /admin/guides, GET /guides/{slug}, POST/PUT /admin/guides response)
export interface GuideDto {
  id: string
  slug: string
  title: string
  contentMarkdown: string
}

// mirrors activation-guides design.md "POST /admin/guides" and "PUT /admin/guides/{id}" request body
export interface GuideRequest {
  slug: string
  title: string
  contentMarkdown?: string
}
```

- [ ] **Step 2: Rename `AdminProduct`, `UpdateProductRequest`, `CreateProductRequest` fields**

In each of the three interfaces, replace:

```typescript
  activationGuide: string | null
```

with:

```typescript
  activationGuideId: string | null
```

- [ ] **Step 3: Rename `ProductDetail`'s field**

Replace:

```typescript
  activationGuide: string | null
```

with:

```typescript
  activationGuideSlug: string | null
```

- [ ] **Step 4: Typecheck**

Run: `npx nuxi typecheck`
Expected: errors in every file still using the old field names — that's Tasks 12–16's job to fix. Do not fix them here.

- [ ] **Step 5: Commit**

```bash
git add types/api.ts
git commit -m "feat(guides): add GuideDto/GuideRequest, rename product activation guide fields"
```

---

### Task 12: `types/imagekit.ts` + `AdminImageUpload.vue` — `/guides` folder, `autoUpload`, full URL in `uploaded`

**Files:**
- Modify: `types/imagekit.ts`
- Modify: `components/admin/AdminImageUpload.vue`
- Modify: `tests/AdminImageUpload.spec.ts`

**Interfaces:**
- Produces: `ImageKitFolder` now includes `'/guides'`; `AdminImageUpload` prop `autoUpload?: boolean`; `uploaded` emit becomes `[filePath: string, url: string]`.

- [ ] **Step 1: Widen `ImageKitFolder`**

```typescript
export type ImageKitFolder = '/products' | '/carousel' | '/guides'
```

- [ ] **Step 2: Update the existing `uploaded` assertions to expect a second `url` argument**

In `tests/AdminImageUpload.spec.ts`, the two `mockImplementation`/`mockResolvedValue` calls on `upload` currently return `{ filePath: '/products/robux.png' }` — add `url: 'https://ik.imagekit.io/test-account/products/robux.png'` to each, and change:

```typescript
    expect(wrapper.emitted('uploaded')).toEqual([['products/robux.png']])
```

to:

```typescript
    expect(wrapper.emitted('uploaded')).toEqual([['products/robux.png', 'https://ik.imagekit.io/test-account/products/robux.png']])
```

- [ ] **Step 3: Add a failing test for `autoUpload`**

```typescript
  it('uploads immediately on selection when autoUpload is set, without waiting for a manual uploadSelected call', async () => {
    api.mockResolvedValue({ token: 'token', signature: 'signature', expire: 1790100000, publicKey: 'public_key' })
    upload.mockResolvedValue({ filePath: '/guides/step-1.png', url: 'https://ik.imagekit.io/test-account/guides/step-1.png' })
    const wrapper = await mountSuspended(AdminImageUpload, { props: { folder: '/guides', autoUpload: true } })
    const file = new File(['image'], 'step-1.png', { type: 'image/png' })
    const input = wrapper.find('input[type="file"]')
    Object.defineProperty(input.element, 'files', { value: [file] })

    await input.trigger('change')
    await flushPromises()

    expect(upload).toHaveBeenCalledWith(expect.objectContaining({ file, folder: '/guides' }))
    expect(wrapper.emitted('uploaded')).toEqual([['guides/step-1.png', 'https://ik.imagekit.io/test-account/guides/step-1.png']])
  })
```

- [ ] **Step 4: Run to verify the new/changed assertions fail**

Run: `npm run test -- tests/AdminImageUpload.spec.ts`
Expected: FAIL — `autoUpload` prop doesn't exist, `uploaded` only carries one argument.

- [ ] **Step 5: Implement in `AdminImageUpload.vue`**

Widen the props and emits:

```typescript
const props = withDefaults(defineProps<{
  folder: ImageKitFolder
  multiple?: boolean
  disabled?: boolean
  label?: string
  compact?: boolean
  autoUpload?: boolean
}>(), { multiple: false, disabled: false, label: 'Subir imagen', compact: false, autoUpload: false })

const emit = defineEmits<{
  uploaded: [filePath: string, url: string]
  preview: [urls: string[]]
  register: [uploadSelected: () => Promise<string[]>]
}>()
```

In `uploadSelected()`, capture the full URL and pass it through the emit:

```typescript
      if (!result.filePath?.trim()) {
        error.value = 'No se pudo obtener la ruta de la imagen subida.'
        throw new Error(error.value)
      }
      const filePath = result.filePath.replace(/^\/+/, '')
      const url = result.url ?? ''
```

(keep the existing `imagekit-assets` registration call unchanged, using `filePath`), then:

```typescript
      uploadedPaths.push(filePath)
      emit('uploaded', filePath, url)
```

In `stageFiles`, after the existing staging logic, auto-trigger the upload when requested:

```typescript
  clearPreviews()
  selectedFiles.value = acceptedFiles
  previewUrls.value = acceptedFiles.map((file) => URL.createObjectURL(file))
  emit('preview', previewUrls.value)

  if (props.autoUpload) {
    void uploadSelected()
  }
```

- [ ] **Step 6: Run to verify it passes**

Run: `npm run test -- tests/AdminImageUpload.spec.ts`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add types/imagekit.ts components/admin/AdminImageUpload.vue tests/AdminImageUpload.spec.ts
git commit -m "feat(admin): support immediate-upload mode and full URL in AdminImageUpload"
```

---

### Task 13: `MarkdownEditor.vue` — insert-image toolbar button

**Files:**
- Modify: `components/admin/MarkdownEditor.vue`
- Test: `tests/MarkdownEditor.spec.ts` (add cases; keep existing ones)

**Interfaces:**
- Consumes: `AdminImageUpload` with `autoUpload` (Task 12).
- Produces: `MarkdownEditor` prop `imageFolder?: ImageKitFolder`.

- [ ] **Step 1: Write the failing test**

Read `tests/MarkdownEditor.spec.ts` first to match its existing mount/props conventions exactly, then add:

```typescript
  it('shows no image button when imageFolder is not set', async () => {
    const wrapper = await mountSuspended(MarkdownEditor, { props: { modelValue: '' } })
    expect(wrapper.findComponent({ name: 'AdminImageUpload' }).exists()).toBe(false)
  })

  it('inserts the uploaded image URL as Markdown at the cursor when imageFolder is set', async () => {
    const wrapper = await mountSuspended(MarkdownEditor, { props: { modelValue: 'Paso 1', imageFolder: '/guides' } })

    await wrapper.findComponent({ name: 'AdminImageUpload' }).vm.$emit('uploaded', 'guides/step.png', 'https://ik.imagekit.io/test-account/guides/step.png')

    expect(wrapper.emitted('update:modelValue')?.at(-1)?.[0]).toContain('![](https://ik.imagekit.io/test-account/guides/step.png)')
  })
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm run test -- tests/MarkdownEditor.spec.ts`
Expected: FAIL — `imageFolder` prop and `AdminImageUpload` toolbar button don't exist.

- [ ] **Step 3: Implement**

Add the prop and an insertion function:

```typescript
import type { ImageKitFolder } from '~/types/imagekit'

withDefaults(defineProps<{ rows?: number; label?: string; imageFolder?: ImageKitFolder }>(), { rows: 5, label: undefined, imageFolder: undefined })
```

Add, alongside `prefixLines`:

```typescript
// Inserted at the current cursor position (or the end, with no selection) — no wrapSelection-style
// marker pairing, since an image reference isn't wrapped text.
function insertImage(url: string) {
  const el = input.value
  const value = text.value
  const pos = el?.selectionStart ?? value.length
  const markdown = `![](${url})`
  text.value = value.slice(0, pos) + markdown + value.slice(pos)
  nextTick(() => {
    el?.focus()
    el?.setSelectionRange(pos + markdown.length, pos + markdown.length)
  })
}
```

In the toolbar `<div class="flex gap-1.5">`, before the "Vista previa" button:

```html
      <AdminImageUpload v-if="imageFolder" :folder="imageFolder" compact auto-upload label="Imagen" @uploaded="(_filePath, url) => insertImage(url)" />
```

- [ ] **Step 4: Run to verify it passes**

Run: `npm run test -- tests/MarkdownEditor.spec.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add components/admin/MarkdownEditor.vue tests/MarkdownEditor.spec.ts
git commit -m "feat(admin): add inline image insertion to MarkdownEditor"
```

---

### Task 14: `useAdminGuides` composable

**Files:**
- Create: `composables/useAdminGuides.ts`
- Test: `tests/useAdminGuides.spec.ts`

**Interfaces:**
- Consumes: `GuideDto`, `GuideRequest` (Task 11).
- Produces: `useAdminGuides()` → `{ guides, status, error, refresh, saving, saveError, createGuide, updateGuide, deleteGuide }`.

- [ ] **Step 1: Write the failing tests**

```typescript
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { ApiError } from '~/composables/useApi'
import { useAdminGuides } from '~/composables/useAdminGuides'
import type { GuideDto } from '~/types/api'

const { apiMock } = vi.hoisted(() => ({ apiMock: vi.fn() }))
mockNuxtImport('useApi', () => () => apiMock)

function buildGuide(): GuideDto {
  return { id: 'g1', slug: 'example-activation-guide', title: 'Ejemplo', contentMarkdown: '## Paso 1' }
}

beforeEach(() => {
  apiMock.mockReset()
})

describe('useAdminGuides createGuide', () => {
  it('posts the guide and appends it locally', async () => {
    apiMock.mockResolvedValueOnce([]).mockResolvedValueOnce(buildGuide())
    const guides = await useAdminGuides()

    const result = await guides.createGuide({ slug: 'example-activation-guide', title: 'Ejemplo', contentMarkdown: '## Paso 1' })

    expect(apiMock).toHaveBeenCalledWith('/admin/guides', { method: 'POST', body: { slug: 'example-activation-guide', title: 'Ejemplo', contentMarkdown: '## Paso 1' } })
    expect(result).toBe(true)
    expect(guides.guides.value).toHaveLength(1)
  })

  it('surfaces a 409 conflict without adding a duplicate locally', async () => {
    apiMock.mockResolvedValueOnce([]).mockRejectedValueOnce(new ApiError({ type: 'about:blank', title: 'Conflict', status: 409 }))
    const guides = await useAdminGuides()

    const result = await guides.createGuide({ slug: 'example-activation-guide', title: 'Ejemplo', contentMarkdown: '' })

    expect(result).toBe(false)
    expect(guides.guides.value).toHaveLength(0)
    expect(guides.saveError.value).toBeInstanceOf(ApiError)
  })
})

describe('useAdminGuides deleteGuide', () => {
  it('deletes via DELETE and removes it from local state', async () => {
    apiMock.mockResolvedValueOnce([buildGuide()]).mockResolvedValueOnce(undefined)
    const guides = await useAdminGuides()

    const result = await guides.deleteGuide('g1')

    expect(apiMock).toHaveBeenCalledWith('/admin/guides/g1', { method: 'DELETE' })
    expect(result).toBe(true)
    expect(guides.guides.value).toHaveLength(0)
  })

  it('keeps the guide locally and surfaces an error on 409 (guide still linked to a product)', async () => {
    apiMock.mockResolvedValueOnce([buildGuide()]).mockRejectedValueOnce(new ApiError({ type: 'about:blank', title: 'Conflict', status: 409 }))
    const guides = await useAdminGuides()

    const result = await guides.deleteGuide('g1')

    expect(result).toBe(false)
    expect(guides.guides.value).toHaveLength(1)
  })
})
```

- [ ] **Step 2: Run to verify they fail**

Run: `npm run test -- tests/useAdminGuides.spec.ts`
Expected: FAIL — module does not exist.

- [ ] **Step 3: Implement**

```typescript
import type { GuideDto, GuideRequest } from '~/types/api'
import { ApiError } from '~/composables/useApi'

/** Admin guide editing (activation-guides spec). Hard delete; a 409 means the guide is still linked to a product. */
export async function useAdminGuides() {
  const api = useApi()
  const toast = useToast()
  const { data: guides, status, error, refresh } = await useAsyncData('admin-guides', () => api<GuideDto[]>('/admin/guides'), { default: (): GuideDto[] => [] })

  const saving = ref(false)
  const saveError = ref<ApiError | null>(null)

  function toApiError(e: unknown) {
    return e instanceof ApiError ? e : new ApiError({ type: 'about:blank', title: 'Request failed', status: 0 })
  }

  function failSave(e: unknown) {
    const err = toApiError(e)
    saveError.value = err
    toast.error(err.friendlyMessage())
  }

  async function createGuide(body: GuideRequest) {
    saving.value = true
    saveError.value = null
    try {
      const created = await api<GuideDto>('/admin/guides', { method: 'POST', body })
      guides.value = [...guides.value, created]
      return true
    } catch (e) {
      failSave(e)
      return false
    } finally {
      saving.value = false
    }
  }

  async function updateGuide(id: string, body: GuideRequest) {
    saving.value = true
    saveError.value = null
    try {
      const updated = await api<GuideDto>(`/admin/guides/${id}`, { method: 'PUT', body })
      const index = guides.value.findIndex((g) => g.id === id)
      if (index !== -1) guides.value[index] = updated
      return true
    } catch (e) {
      failSave(e)
      return false
    } finally {
      saving.value = false
    }
  }

  async function deleteGuide(id: string) {
    saving.value = true
    saveError.value = null
    try {
      await api(`/admin/guides/${id}`, { method: 'DELETE' })
      guides.value = guides.value.filter((g) => g.id !== id)
      return true
    } catch (e) {
      failSave(e)
      return false
    } finally {
      saving.value = false
    }
  }

  return { guides, status, error, refresh, saving, saveError, createGuide, updateGuide, deleteGuide }
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `npm run test -- tests/useAdminGuides.spec.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add composables/useAdminGuides.ts tests/useAdminGuides.spec.ts
git commit -m "feat(admin): add useAdminGuides composable"
```

---

### Task 15: `GuideForm.vue` + `pages/admin/guides.vue`

**Files:**
- Create: `components/admin/GuideForm.vue`
- Create: `pages/admin/guides.vue`
- Test: `tests/GuideForm.spec.ts`

**Interfaces:**
- Consumes: `useAdminGuides()` (Task 14), `MarkdownEditor` with `imageFolder` (Task 13).
- Produces: `GuideForm` emits `save: [body: GuideRequest]`, `cancel: []`.

- [ ] **Step 1: Write the failing `GuideForm` test**

Mirror `tests/SlideForm.spec.ts`'s structure exactly (read it first for the mount/assert conventions used there):

```typescript
import { describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import GuideForm from '~/components/admin/GuideForm.vue'
import type { GuideDto } from '~/types/api'

const guide: GuideDto = { id: 'g1', slug: 'example-activation-guide', title: 'Ejemplo', contentMarkdown: '## Paso 1' }

describe('GuideForm', () => {
  it('renders empty fields with no guide prop', async () => {
    const wrapper = await mountSuspended(GuideForm, { props: { saving: false } })
    expect((wrapper.find('input[type="text"]').element as HTMLInputElement).value).toBe('')
  })

  it('pre-fills fields from an existing guide', async () => {
    const wrapper = await mountSuspended(GuideForm, { props: { guide, saving: false } })
    const inputs = wrapper.findAll('input[type="text"]')
    expect(inputs[0]!.element.value).toBe('example-activation-guide')
    expect(inputs[1]!.element.value).toBe('Ejemplo')
  })

  it('emits save with the trimmed slug/title and current content', async () => {
    const wrapper = await mountSuspended(GuideForm, { props: { guide, saving: false } })
    await wrapper.find('form').trigger('submit')

    expect(wrapper.emitted('save')?.[0]?.[0]).toMatchObject({ slug: 'example-activation-guide', title: 'Ejemplo', contentMarkdown: '## Paso 1' })
  })

  it('does not emit save when slug is blank', async () => {
    const wrapper = await mountSuspended(GuideForm, { props: { saving: false } })
    await wrapper.find('form').trigger('submit')

    expect(wrapper.emitted('save')).toBeUndefined()
  })
})
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm run test -- tests/GuideForm.spec.ts`
Expected: FAIL — component does not exist.

- [ ] **Step 3: Implement `GuideForm.vue`**

```vue
<script setup lang="ts">
import type { GuideDto, GuideRequest } from '~/types/api'

const props = defineProps<{ guide?: GuideDto; saving: boolean }>()
const emit = defineEmits<{ save: [body: GuideRequest]; cancel: [] }>()

const slug = ref(props.guide?.slug ?? '')
const title = ref(props.guide?.title ?? '')
const contentMarkdown = ref(props.guide?.contentMarkdown ?? '')

function submit() {
  if (!slug.value.trim() || !title.value.trim()) return
  emit('save', { slug: slug.value.trim(), title: title.value.trim(), contentMarkdown: contentMarkdown.value })
}
</script>

<template>
  <form class="glass flex flex-col gap-3 rounded-2xl p-4" @submit.prevent="submit">
    <label class="flex flex-col gap-1 text-sm">
      <span class="text-white/70">Slug (URL: /article/…)</span>
      <input v-model="slug" type="text" required pattern="[a-z0-9-]+" placeholder="microsoft-gift-card-activation" class="h-10 rounded-lg border border-white/10 bg-white/5 px-3 text-white outline-none focus:border-accent" />
    </label>
    <label class="flex flex-col gap-1 text-sm">
      <span class="text-white/70">Título</span>
      <input v-model="title" type="text" required class="h-10 rounded-lg border border-white/10 bg-white/5 px-3 text-white outline-none focus:border-accent" />
    </label>
    <MarkdownEditor v-model="contentMarkdown" label="Contenido (admite Markdown)" :rows="12" image-folder="/guides" />
    <div class="flex gap-2">
      <AppButton type="submit" size="sm" :loading="saving">{{ guide ? 'Guardar' : 'Agregar' }}</AppButton>
      <AppButton v-if="guide" type="button" variant="ghost" size="sm" @click="emit('cancel')">Cancelar</AppButton>
    </div>
  </form>
</template>
```

- [ ] **Step 4: Run to verify it passes**

Run: `npm run test -- tests/GuideForm.spec.ts`
Expected: PASS

- [ ] **Step 5: Implement `pages/admin/guides.vue`**

```vue
<script setup lang="ts">
import type { GuideRequest } from '~/types/api'

definePageMeta({ middleware: ['auth', 'admin'] })
useHead({ title: 'Guías de activación · Admin · CHEKEYS' })

const { guides, status, error, refresh, saving, createGuide, updateGuide, deleteGuide } = await useAdminGuides()

const editingId = ref<string | null>(null)

async function onUpdate(id: string, body: GuideRequest) {
  if (await updateGuide(id, body)) editingId.value = null
}
</script>

<template>
  <section class="flex flex-col gap-6">
    <h1 class="text-2xl font-bold">Guías de activación</h1>

    <GuideForm :saving="saving" @save="(body: GuideRequest) => createGuide(body)" />

    <div v-if="status === 'pending'" class="grid gap-3">
      <Skeleton v-for="n in 3" :key="n" class="h-16 w-full" />
    </div>
    <ErrorState v-else-if="error">
      <template #retry><AppButton variant="ghost" @click="refresh()">Reintentar</AppButton></template>
    </ErrorState>
    <EmptyState v-else-if="!guides.length" title="Todavía no hay guías" />
    <div v-else class="flex flex-col gap-3">
      <template v-for="guide in guides" :key="guide.id">
        <GuideForm
          v-if="editingId === guide.id"
          :guide="guide"
          :saving="saving"
          @save="(body: GuideRequest) => onUpdate(guide.id, body)"
          @cancel="editingId = null"
        />
        <div v-else class="flex flex-wrap items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3 text-sm">
          <span class="min-w-0 flex-1 truncate">{{ guide.title }} · {{ guide.slug }}</span>
          <AppButton type="button" variant="ghost" size="sm" @click="editingId = guide.id">Editar</AppButton>
          <AppButton type="button" variant="ghost" size="sm" @click="deleteGuide(guide.id)">Eliminar</AppButton>
        </div>
      </template>
    </div>
  </section>
</template>
```

- [ ] **Step 6: Commit**

```bash
git add components/admin/GuideForm.vue pages/admin/guides.vue tests/GuideForm.spec.ts
git commit -m "feat(admin): add activation guides CRUD page"
```

---

### Task 16: `ProductEditor.vue` + `pages/admin/catalog.vue` — guide picker instead of free text

**Files:**
- Modify: `components/admin/ProductEditor.vue`
- Modify: `pages/admin/catalog.vue`
- Modify: `tests/ProductEditor.spec.ts`

**Interfaces:**
- Consumes: `GuideDto[]` (fetched by `catalog.vue` via `useAdminGuides()`), `AdminProduct.activationGuideId` (Task 11).
- Produces: `ProductEditor` gains a required `guides: GuideDto[]` prop; `save` payload carries `activationGuideId` instead of `activationGuide`.

- [ ] **Step 1: Update the failing test fixtures first**

In `tests/ProductEditor.spec.ts`, change the `product` fixture's `activationGuide: null` to `activationGuideId: null`, and pass a `guides: []` prop to every `mountSuspended(ProductEditor, { props: { product, saving: false, ... } })` call. Add:

```typescript
  it('lets the admin pick an existing guide and includes it in the save payload', async () => {
    const guides: GuideDto[] = [{ id: 'g1', slug: 'example-activation-guide', title: 'Ejemplo', contentMarkdown: '' }]
    const wrapper = await mountSuspended(ProductEditor, { props: { product, saving: false, guides } })
    await wrapper.find('button').trigger('click')

    await wrapper.find('select[name="activationGuideId"]').setValue('g1')
    await wrapper.find('form').trigger('submit')

    expect(wrapper.emitted('save')?.[0]?.[0]).toMatchObject({ activationGuideId: 'g1' })
  })

  it('sends null when no guide is selected', async () => {
    const wrapper = await mountSuspended(ProductEditor, { props: { product, saving: false, guides: [] } })
    await wrapper.find('button').trigger('click')
    await wrapper.find('form').trigger('submit')

    expect(wrapper.emitted('save')?.[0]?.[0]).toMatchObject({ activationGuideId: null })
  })
```

Add `import type { GuideDto } from '~/types/api'` to the top of the test file alongside the existing `AdminProduct` import.

- [ ] **Step 2: Run to verify it fails**

Run: `npm run test -- tests/ProductEditor.spec.ts`
Expected: FAIL — no `guides` prop, no `select[name="activationGuideId"]`.

- [ ] **Step 3: Update `ProductEditor.vue`'s script**

Replace:

```typescript
const props = defineProps<{ product: AdminProduct; saving: boolean; initiallyExpanded?: boolean }>()
```

with:

```typescript
const props = defineProps<{ product: AdminProduct; guides: GuideDto[]; saving: boolean; initiallyExpanded?: boolean }>()
```

Add `GuideDto` to the existing `~/types/api` import.

Replace:

```typescript
// The guide is optional and the product page only shows its section when one exists, so the
// checkbox makes "no guide" an explicit choice instead of relying on an empty textarea.
const hasActivationGuide = ref(props.product.activationGuide !== null)
const activationGuide = ref(props.product.activationGuide ?? '')
```

with:

```typescript
const activationGuideId = ref(props.product.activationGuideId ?? '')
```

In the `watch(() => props.product, ...)` handler, replace:

```typescript
  hasActivationGuide.value = product.activationGuide !== null
  activationGuide.value = product.activationGuide ?? ''
```

with:

```typescript
  activationGuideId.value = product.activationGuideId ?? ''
```

In `submit()`, replace:

```typescript
    // An enabled-but-blank guide would render an empty section, so it is sent as "no guide".
    activationGuide: hasActivationGuide.value && activationGuide.value.trim() ? activationGuide.value : null,
```

with:

```typescript
    activationGuideId: activationGuideId.value || null,
```

- [ ] **Step 4: Update the template**

Replace the "Activación" section's guide sub-block (the `md:grid-cols-[...]` div containing the "Tipo" input and "Tiene guía de activación" checkbox, plus the `v-if="hasActivationGuide"` block below it):

```html
          <div class="grid gap-4 md:grid-cols-[minmax(12rem,1fr)_minmax(0,2fr)] md:items-end">
            <label class="flex min-w-0 flex-col gap-2 text-sm">
              <span class="text-white/70">Tipo</span>
              <input v-model="activationType" type="text" placeholder="Enlace de activación" class="h-11 min-w-0 rounded-xl border border-white/10 bg-white/5 px-4 text-white outline-none focus:border-accent" />
            </label>

            <label class="flex min-w-0 flex-col gap-2 text-sm">
              <span class="text-white/70">Guía de activación</span>
              <select v-model="activationGuideId" name="activationGuideId" class="h-11 min-w-0 rounded-xl border border-white/10 bg-white/5 px-4 text-white outline-none focus:border-accent">
                <option value="">Sin guía</option>
                <option v-for="guide in guides" :key="guide.id" :value="guide.id">{{ guide.title }}</option>
              </select>
            </label>
          </div>
```

(This removes the old `v-if="hasActivationGuide"` `<MarkdownEditor>` block entirely — the guide's content is now edited on `/admin/guides`, not per-product.)

- [ ] **Step 5: Run to verify it passes**

Run: `npm run test -- tests/ProductEditor.spec.ts`
Expected: PASS

- [ ] **Step 6: Update `pages/admin/catalog.vue`**

Add the guides fetch alongside the existing `useAdminCatalog()` call:

```typescript
const { guides } = await useAdminGuides()
```

Pass `:guides="guides"` to `<ProductEditor>`:

```html
      <ProductEditor
        v-for="product in filteredProducts"
        :key="product.id"
        :product="product"
        :guides="guides"
        :saving="saving"
        :initially-expanded="product.id === highlightedProductId"
        ...
```

In `submitNewProduct()`, replace:

```typescript
    activationGuide: null,
```

with:

```typescript
    activationGuideId: null,
```

- [ ] **Step 7: Commit**

```bash
git add components/admin/ProductEditor.vue pages/admin/catalog.vue tests/ProductEditor.spec.ts
git commit -m "feat(admin): replace free-text activation guide with a guide picker"
```

---

### Task 17: `pages/product/[slug].vue` — link to `/article/{slug}` instead of inline guide

**Files:**
- Modify: `pages/product/[slug].vue`

- [ ] **Step 1: Update the script**

Remove:

```typescript
const activationGuideHtml = computed(() => (product.value?.activationGuide ? renderMarkdown(product.value.activationGuide) : ''))

// Only the first rendered bottom section starts open: the guide when there is one, else the description.
const activationGuideOpen = ref(!!product.value?.activationGuide)
const fullDescriptionOpen = ref(!product.value?.activationGuide)
```

Replace with:

```typescript
const fullDescriptionOpen = ref(false)
```

Remove `function openActivationGuide() { revealSection(activationGuideOpen, 'activation-guide') }` (keep `revealSection` itself — `scrollToFullDescription` still uses it).

In the `specs` computed, replace:

```typescript
      action: product.value.activationGuide ? { text: 'Consultar guía de activación', onClick: openActivationGuide } : undefined,
```

with:

```typescript
      action: product.value.activationGuideSlug ? { text: 'Consultar guía de activación', href: `/article/${product.value.activationGuideSlug}` } : undefined,
```

Update the `SpecItem` type:

```typescript
type SpecItem = { icon: 'platform' | 'region' | 'type'; label: string; value: string; action?: { text: string; href: string } }
```

- [ ] **Step 2: Update the template**

Replace:

```html
              <button v-if="spec.action" type="button" class="self-start text-xs font-medium text-accent hover:text-accent-hover" @click="spec.action.onClick()">{{ spec.action.text }}</button>
```

with:

```html
              <NuxtLink v-if="spec.action" :to="spec.action.href" class="self-start text-xs font-medium text-accent hover:text-accent-hover">{{ spec.action.text }}</NuxtLink>
```

Remove the entire `<CollapsibleSection v-if="product.activationGuide" id="activation-guide" ...>...</CollapsibleSection>` block (the guide section, immediately before the "Descripción completa" `CollapsibleSection`).

- [ ] **Step 3: Typecheck**

Run: `npx nuxi typecheck`
Expected: no errors referencing this file.

- [ ] **Step 4: Manual verification**

Run: `npm run dev`, open a product with `activationGuideSlug` set (assign the seeded example guide to a product via `/admin/catalog` first), confirm "Consultar guía de activación" renders as a link to `/article/example-activation-guide` and navigates there. (No automated test exists for this page today — `pages/*.vue` aren't unit-tested in this repo, per existing convention; this stays a manual check, consistent with how `pages/product/[slug].vue`'s other behavior is verified.)

- [ ] **Step 5: Commit**

```bash
git add pages/product/[slug].vue
git commit -m "feat(product): link to the standalone activation guide page instead of an inline section"
```

---

### Task 18: `pages/article/[slug].vue` — public guide page

**Files:**
- Create: `pages/article/[slug].vue`

**Interfaces:**
- Consumes: `GuideDto` (Task 11), `renderMarkdown` (`utils/markdown.ts`), `GET /guides/{slug}` (backend Task 6).

- [ ] **Step 1: Implement the page**

```vue
<script setup lang="ts">
import type { GuideDto } from '~/types/api'
import type { ApiError } from '~/composables/useApi'
import { renderMarkdown } from '~/utils/markdown'

const slug = useRoute().params.slug as string
const api = useApi()

// activation-guides spec: unknown slug → 404, same pattern as pages/product/[slug].vue.
const { data: guide, error } = await useAsyncData(`guide-${slug}`, () => api<GuideDto>(`/guides/${slug}`))

const httpStatus = error.value?.statusCode ?? (error.value?.cause as ApiError | undefined)?.status
if (httpStatus === 404) throw createError({ statusCode: 404, statusMessage: 'Guía no encontrada', fatal: true })

useHead({ title: () => (guide.value ? `${guide.value.title} · CHEKEYS` : 'CHEKEYS') })

const contentHtml = computed(() => (guide.value ? renderMarkdown(guide.value.contentMarkdown) : ''))
</script>

<template>
  <section v-if="guide" class="mx-auto flex max-w-2xl flex-col gap-6">
    <header>
      <p class="text-xs font-semibold uppercase tracking-wider text-accent">Guía de activación</p>
      <h1 class="mt-2 text-3xl font-bold sm:text-4xl">{{ guide.title }}</h1>
    </header>
    <div class="markdown-body text-base leading-relaxed text-white/70" v-html="contentHtml" />
  </section>
</template>
```

- [ ] **Step 2: Manual verification**

Run: `npm run dev`, navigate to `/article/example-activation-guide` (after seeding via `--seed-guides seed/guides.json` on the backend), confirm the title and Markdown content render, and that an unknown slug (e.g. `/article/does-not-exist`) shows the app's 404 page. As with Task 17, `pages/*.vue` have no unit tests in this repo — this stays a manual check.

- [ ] **Step 3: Typecheck and full test run**

Run: `npx nuxi typecheck && npm run test`
Expected: 0 errors, all tests PASS.

- [ ] **Step 4: Commit**

```bash
git add pages/article/[slug].vue
git commit -m "feat(article): add public activation guide page"
```

---

## Post-plan manual smoke test (both repos running together)

1. Backend: `dotnet ef database update` (or `--migrate`), then `dotnet run --project src/Maxkeys.Api -- --seed-guides seed/guides.json`.
2. Start both apps; open `/admin/guides`, confirm the seeded "Ejemplo de guía de activación" appears, edit it (add an image via the toolbar button), save.
3. Open `/admin/catalog`, expand a product, select that guide from the new dropdown, save.
4. Open that product's `/product/{slug}` page, click "Consultar guía de activación", confirm it navigates to `/article/example-activation-guide` and renders the edited content including the inserted image.
5. Back in `/admin/guides`, try deleting that guide — confirm it's rejected (toast) while still linked; unassign it from the product, delete again — confirm it succeeds.
