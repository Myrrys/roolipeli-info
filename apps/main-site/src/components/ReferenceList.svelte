<script lang="ts">
import type { ProductReference } from '@roolipeli/database';

const { references = [] }: { references: ProductReference[] } = $props();

// Sort: Official first by priority usually, but here we likely receive a pre-filtered list or render sections separately.
// Actually, this component might just render a list of what's passed to it.
</script>

<ul class="reference-list">
    {#each references as reference}
        <li>
            <a
                href={reference.url}
                target="_blank"
                rel="noopener noreferrer"
                class="reference-link"
            >
                <span class="label">{reference.label}</span>
                {#if reference.reference_type === "review" && reference.citation_details}
                    <!-- Bibliographic rendering -->
                    <!-- e.g. "Author (Year). Publication." -->
                    <span class="citation">
                        {#if reference.citation_details.author}
                            {reference.citation_details.author}.
                        {/if}
                        {#if reference.citation_details.published_date}
                            ({new Date(
                                reference.citation_details.published_date,
                            ).getFullYear()}).
                        {/if}
                        {#if reference.citation_details.publication_name}
                            <em
                                >{reference.citation_details
                                    .publication_name}</em
                            >.
                        {/if}
                    </span>
                {/if}
            </a>
            <!-- 
        If it's an official source, maybe an icon?
        For now, just text.
      -->
        </li>
    {/each}
</ul>

<style>
    .reference-list {
        list-style: none;
        padding: 0;
        margin: 0;
        display: flex;
        flex-direction: column;
        gap: var(--kide-space-2);
    }

    .reference-link {
        display: flex;
        flex-direction: column;
        text-decoration: none;
        color: var(--kide-ink-primary);
        padding: var(--kide-space-2);
        border: 1px solid var(--kide-ice-light);
        border-radius: var(--kide-radius-sm);
        transition: all 0.2s ease;
    }

    .reference-link:hover {
        background: var(--kide-surface);
        border-color: var(--kide-ice-deep);
        color: var(--kide-ice-deep);
    }

    .label {
        font-weight: 600;
    }

    .citation {
        font-size: 0.875rem;
        color: var(--kide-ink-muted);
    }

    .citation em {
        font-style: italic;
    }
</style>
