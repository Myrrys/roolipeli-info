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
    padding: 1.5rem;
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    text-decoration: none;
    color: inherit;
    transition: border-color 0.2s;
  }

  .product-card:hover {
    border-color: #666;
  }

  h3 {
    margin: 0 0 0.5rem 0;
    font-size: 1.25rem;
    font-weight: 600;
  }

  .publisher {
    margin: 0 0 0.75rem 0;
    color: #666;
    font-size: 0.875rem;
  }

  .meta {
    display: flex;
    gap: 0.75rem;
    font-size: 0.75rem;
    color: #999;
  }

  .type,
  .year,
  .lang {
    padding: 0.25rem 0.5rem;
    background: #f5f5f5;
    border-radius: 4px;
  }
</style>
