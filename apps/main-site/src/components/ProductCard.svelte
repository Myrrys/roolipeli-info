<script lang="ts">
interface Props {
  title: string;
  slug: string;
  publisher?: { name: string; slug: string } | null;
  productType: string;
  year?: number | null;
  lang: string;
}

const { title, slug, publisher, productType, year, lang } = $props<Props>();
</script>

<a href={`/tuotteet/${slug}`} class="product-card">
  <h3>{title}</h3>
  {#if publisher}
    <p class="publisher">{publisher.name}</p>
  {/if}
  <div class="meta">
    <span class="type">{productType}</span>
    {#if year}
      <span class="year">{year}</span>
    {/if}
    <span class="lang">{lang.toUpperCase()}</span>
  </div>
</a>

<style>
  .product-card {
    display: block;
    padding: var(--kide-space-3);
    border: 1px solid var(--kide-border-subtle);
    border-radius: var(--kide-radius-md);
    text-decoration: none;
    color: inherit;
    transition: all 0.2s;
    background: var(--kide-surface);
  }

  .product-card:hover {
    border-color: var(--kide-ice-deep);
    box-shadow: var(--kide-shadow-soft);
    transform: translateY(-2px);
  }

  h3 {
    margin: 0 0 var(--kide-space-1) 0;
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--kide-ink-header);
    font-family: var(--kide-font-serif);
  }

  .publisher {
    margin: 0 0 var(--kide-space-2) 0;
    color: var(--kide-ink-muted);
    font-size: 0.875rem;
  }

  .meta {
    display: flex;
    gap: var(--kide-space-2);
    font-size: 0.75rem;
    color: var(--kide-ink-muted);
  }

  .type,
  .year,
  .lang {
    padding: 0.25rem 0.5rem;
    background: var(--kide-ice-light);
    color: var(--kide-ice-deep);
    border-radius: var(--kide-radius-sm);
    font-weight: 600;
  }
</style>
