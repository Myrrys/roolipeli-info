import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Database } from '../src/types/supabase';

/**
 * Unit tests for database query layer
 * Spec: specs/product-catalog/spec.md - Query Layer Section
 *
 * These tests use mocked Supabase client to verify query structure
 * and error handling without requiring actual database connection.
 */

// Mock the Supabase client
const mockSelect = vi.fn();
const mockEq = vi.fn();
const mockOrder = vi.fn();
const mockSingle = vi.fn();
const mockFrom = vi.fn(() => ({
  select: mockSelect,
}));

// Mock @supabase/supabase-js
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    from: mockFrom,
  })),
}));

// Mock environment variables
vi.stubEnv('SUPABASE_URL', 'https://test.supabase.co');
vi.stubEnv('SUPABASE_ANON_KEY', 'test-anon-key');

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
    });
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

      // Dynamically import to ensure mock is applied
      const { getProducts } = await import('../src/queries');
      const result = await getProducts();

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

      await expect(getProducts()).rejects.toThrow();
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
      const result = await getProductBySlug('test-game');

      // Verify query structure
      expect(mockFrom).toHaveBeenCalledWith('products');
      expect(mockSelect).toHaveBeenCalledWith(expect.stringContaining('publisher:publishers'));
      expect(mockSelect).toHaveBeenCalledWith(expect.stringContaining('products_creators'));
      expect(mockEq).toHaveBeenCalledWith('slug', 'test-game');
      expect(mockSingle).toHaveBeenCalled();

      expect(result).toEqual(mockProduct);
    });

    it('throws error when product not found', async () => {
      const mockError = new Error('Product not found');
      mockSingle.mockResolvedValue({
        data: null,
        error: mockError,
      });

      const { getProductBySlug } = await import('../src/queries');

      await expect(getProductBySlug('non-existent')).rejects.toThrow();
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
      const result = await getPublishers();

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
      const result = await getPublishers();

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
      const result = await getPublisherBySlug('test-publisher');

      expect(mockFrom).toHaveBeenCalledWith('publishers');
      expect(mockSelect).toHaveBeenCalledWith(expect.stringContaining('products('));
      expect(mockEq).toHaveBeenCalledWith('slug', 'test-publisher');
      expect(mockSingle).toHaveBeenCalled();

      expect(result).toEqual(mockPublisher);
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
      const result = await getCreators();

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
      const result = await getCreatorBySlug('test-creator');

      expect(mockFrom).toHaveBeenCalledWith('creators');
      expect(mockSelect).toHaveBeenCalledWith(expect.stringContaining('products_creators'));
      expect(mockEq).toHaveBeenCalledWith('slug', 'test-creator');
      expect(mockSingle).toHaveBeenCalled();

      expect(result).toEqual(mockCreator);
    });
  });
});
