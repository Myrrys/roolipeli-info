import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Unit tests for database query layer
 * Spec: specs/product-catalog/spec.md - Query Layer Section
 *
 * These tests use mocked Supabase client to verify query structure
 * and error handling without requiring actual database connection.
 */

// Mock chain functions
const mockSelect = vi.fn();
const mockEq = vi.fn();
const mockOrder = vi.fn();
const mockSingle = vi.fn();
const mockMaybeSingle = vi.fn();

// Separate mock chain for entity_references queries
const mockRefSelect = vi.fn();
const mockRefEq1 = vi.fn();
const mockRefEq2 = vi.fn();

const mockFrom = vi.fn((table: string) => {
  if (table === 'entity_references') {
    return { select: mockRefSelect };
  }
  return { select: mockSelect };
});

// Create mock Supabase client for dependency injection
const mockSupabase = {
  from: mockFrom,
} as unknown as import('../src/queries').DatabaseClient;

describe('Query Layer', () => {
  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks();

    // Setup default mock chain
    mockSelect.mockReturnValue({
      order: mockOrder,
      eq: mockEq,
    });

    mockOrder.mockReturnValue({
      eq: mockEq,
    });

    mockEq.mockReturnValue({
      single: mockSingle,
      maybeSingle: mockMaybeSingle,
    });

    // Setup entity_references mock chain
    mockRefSelect.mockReturnValue({ eq: mockRefEq1 });
    mockRefEq1.mockReturnValue({ eq: mockRefEq2 });
    mockRefEq2.mockResolvedValue({ data: [] });
  });

  describe('getProducts()', () => {
    it('fetches all products with publisher data', async () => {
      const mockProducts = [
        {
          id: '1',
          title: 'Test Game',
          slug: 'test-game',
          product_type: 'Core Rulebook',
          year: 2024,
          lang: 'fi',
          publisher: { id: 'p1', name: 'Test Publisher', slug: 'test-publisher' },
        },
      ];

      mockOrder.mockResolvedValue({
        data: mockProducts,
        error: null,
      });

      const { getProducts } = await import('../src/queries');
      const result = await getProducts(mockSupabase);

      // Verify Supabase calls
      expect(mockFrom).toHaveBeenCalledWith('products');
      expect(mockSelect).toHaveBeenCalledWith(expect.stringContaining('publisher:publishers'));
      expect(mockOrder).toHaveBeenCalledWith('created_at', { ascending: false });

      // Verify result
      expect(result).toEqual(mockProducts);
    });

    it('throws error on database failure', async () => {
      const mockError = new Error('Database connection failed');
      mockOrder.mockResolvedValue({
        data: null,
        error: mockError,
      });

      const { getProducts } = await import('../src/queries');

      await expect(getProducts(mockSupabase)).rejects.toThrow();
    });
  });

  describe('getProductBySlug()', () => {
    it('fetches single product with full relations', async () => {
      const mockProduct = {
        id: '1',
        title: 'Test Game',
        slug: 'test-game',
        publisher: { id: 'p1', name: 'Test Publisher' },
        products_creators: [
          { role: 'Author', creator: { id: 'c1', name: 'Test Creator', slug: 'test-creator' } },
        ],
      };

      mockSingle.mockResolvedValue({
        data: mockProduct,
        error: null,
      });

      const { getProductBySlug } = await import('../src/queries');
      const result = await getProductBySlug(mockSupabase, 'test-game');

      // Verify query structure
      expect(mockFrom).toHaveBeenCalledWith('products');
      expect(mockSelect).toHaveBeenCalledWith(expect.stringContaining('publisher:publishers'));
      expect(mockSelect).toHaveBeenCalledWith(expect.stringContaining('products_creators'));
      expect(mockEq).toHaveBeenCalledWith('slug', 'test-game');
      expect(mockSingle).toHaveBeenCalled();

      // Verify references fetched from entity_references
      expect(mockFrom).toHaveBeenCalledWith('entity_references');

      expect(result).toEqual({ ...mockProduct, references: [] });
    });

    it('throws error when product not found', async () => {
      const mockError = new Error('Product not found');
      mockSingle.mockResolvedValue({
        data: null,
        error: mockError,
      });

      const { getProductBySlug } = await import('../src/queries');

      await expect(getProductBySlug(mockSupabase, 'non-existent')).rejects.toThrow();
    });
  });

  describe('getPublishers()', () => {
    it('fetches all publishers sorted alphabetically', async () => {
      const mockPublishers = [
        { id: '1', name: 'Alpha Publisher', slug: 'alpha' },
        { id: '2', name: 'Beta Publisher', slug: 'beta' },
      ];

      mockOrder.mockResolvedValue({
        data: mockPublishers,
        error: null,
      });

      const { getPublishers } = await import('../src/queries');
      const result = await getPublishers(mockSupabase);

      expect(mockFrom).toHaveBeenCalledWith('publishers');
      expect(mockSelect).toHaveBeenCalledWith('*');
      expect(mockOrder).toHaveBeenCalledWith('name', { ascending: true });

      expect(result).toEqual(mockPublishers);
    });

    it('handles empty publisher list', async () => {
      mockOrder.mockResolvedValue({
        data: [],
        error: null,
      });

      const { getPublishers } = await import('../src/queries');
      const result = await getPublishers(mockSupabase);

      expect(result).toEqual([]);
    });
  });

  describe('getPublisherBySlug()', () => {
    it('fetches single publisher with products', async () => {
      const mockPublisher = {
        id: '1',
        name: 'Test Publisher',
        slug: 'test-publisher',
        products: [{ id: 'p1', title: 'Game 1', slug: 'game-1', product_type: 'Core Rulebook' }],
      };

      mockSingle.mockResolvedValue({
        data: mockPublisher,
        error: null,
      });

      const { getPublisherBySlug } = await import('../src/queries');
      const result = await getPublisherBySlug(mockSupabase, 'test-publisher');

      expect(mockFrom).toHaveBeenCalledWith('publishers');
      expect(mockSelect).toHaveBeenCalledWith(expect.stringContaining('products('));
      expect(mockEq).toHaveBeenCalledWith('slug', 'test-publisher');
      expect(mockSingle).toHaveBeenCalled();

      expect(result).toEqual({ ...mockPublisher, references: [] });
    });
  });

  describe('getCreators()', () => {
    it('fetches all creators sorted alphabetically', async () => {
      const mockCreators = [
        { id: '1', name: 'Alice Author', slug: 'alice-author' },
        { id: '2', name: 'Bob Artist', slug: 'bob-artist' },
      ];

      mockOrder.mockResolvedValue({
        data: mockCreators,
        error: null,
      });

      const { getCreators } = await import('../src/queries');
      const result = await getCreators(mockSupabase);

      expect(mockFrom).toHaveBeenCalledWith('creators');
      expect(mockSelect).toHaveBeenCalledWith('*');
      expect(mockOrder).toHaveBeenCalledWith('name', { ascending: true });

      expect(result).toEqual(mockCreators);
    });
  });

  describe('getCreatorBySlug()', () => {
    it('fetches single creator with products', async () => {
      const mockCreator = {
        id: '1',
        name: 'Test Creator',
        slug: 'test-creator',
        products_creators: [
          {
            role: 'Author',
            product: { id: 'p1', title: 'Game 1', slug: 'game-1' },
          },
        ],
      };

      mockSingle.mockResolvedValue({
        data: mockCreator,
        error: null,
      });

      const { getCreatorBySlug } = await import('../src/queries');
      const result = await getCreatorBySlug(mockSupabase, 'test-creator');

      expect(mockFrom).toHaveBeenCalledWith('creators');
      expect(mockSelect).toHaveBeenCalledWith(expect.stringContaining('products_creators'));
      expect(mockEq).toHaveBeenCalledWith('slug', 'test-creator');
      expect(mockSingle).toHaveBeenCalled();

      expect(result).toEqual({ ...mockCreator, references: [] });
    });
  });
});
