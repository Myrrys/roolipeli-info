export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: '14.1';
  };
  public: {
    Tables: {
      creators: {
        Row: {
          created_at: string;
          id: string;
          name: string;
          slug: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          name: string;
          slug: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          name?: string;
          slug?: string;
        };
        Relationships: [];
      };
      game_based_on: {
        Row: {
          based_on_game_id: string | null;
          based_on_url: string | null;
          created_at: string;
          game_id: string;
          id: string;
          label: string;
        };
        Insert: {
          based_on_game_id?: string | null;
          based_on_url?: string | null;
          created_at?: string;
          game_id: string;
          id?: string;
          label: string;
        };
        Update: {
          based_on_game_id?: string | null;
          based_on_url?: string | null;
          created_at?: string;
          game_id?: string;
          id?: string;
          label?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'game_based_on_based_on_game_id_fkey';
            columns: ['based_on_game_id'];
            isOneToOne: false;
            referencedRelation: 'games';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'game_based_on_game_id_fkey';
            columns: ['game_id'];
            isOneToOne: false;
            referencedRelation: 'games';
            referencedColumns: ['id'];
          },
        ];
      };
      game_references: {
        Row: {
          citation_details: Json | null;
          created_at: string;
          game_id: string;
          id: string;
          label: string;
          reference_type: string;
          url: string;
        };
        Insert: {
          citation_details?: Json | null;
          created_at?: string;
          game_id: string;
          id?: string;
          label: string;
          reference_type: string;
          url: string;
        };
        Update: {
          citation_details?: Json | null;
          created_at?: string;
          game_id?: string;
          id?: string;
          label?: string;
          reference_type?: string;
          url?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'game_references_game_id_fkey';
            columns: ['game_id'];
            isOneToOne: false;
            referencedRelation: 'games';
            referencedColumns: ['id'];
          },
        ];
      };
      game_semantic_labels: {
        Row: {
          game_id: string;
          idx: number | null;
          label_id: string;
        };
        Insert: {
          game_id: string;
          idx?: number | null;
          label_id: string;
        };
        Update: {
          game_id?: string;
          idx?: number | null;
          label_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'game_semantic_labels_game_id_fkey';
            columns: ['game_id'];
            isOneToOne: false;
            referencedRelation: 'games';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'game_semantic_labels_label_id_fkey';
            columns: ['label_id'];
            isOneToOne: false;
            referencedRelation: 'semantic_labels';
            referencedColumns: ['id'];
          },
        ];
      };
      games: {
        Row: {
          created_at: string;
          description: string | null;
          id: string;
          image_url: string | null;
          in_language: Database['public']['Enums']['product_lang'] | null;
          license: string | null;
          name: string;
          number_of_players: string | null;
          publisher_id: string | null;
          slug: string;
          url: string | null;
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          id?: string;
          image_url?: string | null;
          in_language?: Database['public']['Enums']['product_lang'] | null;
          license?: string | null;
          name: string;
          number_of_players?: string | null;
          publisher_id?: string | null;
          slug: string;
          url?: string | null;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          id?: string;
          image_url?: string | null;
          in_language?: Database['public']['Enums']['product_lang'] | null;
          license?: string | null;
          name?: string;
          number_of_players?: string | null;
          publisher_id?: string | null;
          slug?: string;
          url?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'games_publisher_id_fkey';
            columns: ['publisher_id'];
            isOneToOne: false;
            referencedRelation: 'publishers';
            referencedColumns: ['id'];
          },
        ];
      };
      games_creators: {
        Row: {
          creator_id: string;
          game_id: string;
          role: string;
        };
        Insert: {
          creator_id: string;
          game_id: string;
          role: string;
        };
        Update: {
          creator_id?: string;
          game_id?: string;
          role?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'games_creators_creator_id_fkey';
            columns: ['creator_id'];
            isOneToOne: false;
            referencedRelation: 'creators';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'games_creators_game_id_fkey';
            columns: ['game_id'];
            isOneToOne: false;
            referencedRelation: 'games';
            referencedColumns: ['id'];
          },
        ];
      };
      product_isbns: {
        Row: {
          created_at: string;
          id: string;
          isbn: string;
          label: string | null;
          product_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          isbn: string;
          label?: string | null;
          product_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          isbn?: string;
          label?: string | null;
          product_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'product_isbns_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'products';
            referencedColumns: ['id'];
          },
        ];
      };
      product_references: {
        Row: {
          citation_details: Json | null;
          created_at: string;
          id: string;
          label: string;
          product_id: string;
          reference_type: string;
          url: string;
        };
        Insert: {
          citation_details?: Json | null;
          created_at?: string;
          id?: string;
          label: string;
          product_id: string;
          reference_type: string;
          url: string;
        };
        Update: {
          citation_details?: Json | null;
          created_at?: string;
          id?: string;
          label?: string;
          product_id?: string;
          reference_type?: string;
          url?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'product_references_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'products';
            referencedColumns: ['id'];
          },
        ];
      };
      product_semantic_labels: {
        Row: {
          idx: number | null;
          label_id: string;
          product_id: string;
        };
        Insert: {
          idx?: number | null;
          label_id: string;
          product_id: string;
        };
        Update: {
          idx?: number | null;
          label_id?: string;
          product_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'product_semantic_labels_label_id_fkey';
            columns: ['label_id'];
            isOneToOne: false;
            referencedRelation: 'semantic_labels';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'product_semantic_labels_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'products';
            referencedColumns: ['id'];
          },
        ];
      };
      products: {
        Row: {
          cover_image_path: string | null;
          created_at: string;
          description: string | null;
          game_id: string | null;
          id: string;
          isbn: string | null;
          lang: Database['public']['Enums']['product_lang'];
          product_type: Database['public']['Enums']['product_type'];
          publisher_id: string | null;
          slug: string;
          title: string;
          year: number | null;
        };
        Insert: {
          cover_image_path?: string | null;
          created_at?: string;
          description?: string | null;
          game_id?: string | null;
          id?: string;
          isbn?: string | null;
          lang?: Database['public']['Enums']['product_lang'];
          product_type?: Database['public']['Enums']['product_type'];
          publisher_id?: string | null;
          slug: string;
          title: string;
          year?: number | null;
        };
        Update: {
          cover_image_path?: string | null;
          created_at?: string;
          description?: string | null;
          game_id?: string | null;
          id?: string;
          isbn?: string | null;
          lang?: Database['public']['Enums']['product_lang'];
          product_type?: Database['public']['Enums']['product_type'];
          publisher_id?: string | null;
          slug?: string;
          title?: string;
          year?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'products_game_id_fkey';
            columns: ['game_id'];
            isOneToOne: false;
            referencedRelation: 'games';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'products_publisher_id_fkey';
            columns: ['publisher_id'];
            isOneToOne: false;
            referencedRelation: 'publishers';
            referencedColumns: ['id'];
          },
        ];
      };
      products_creators: {
        Row: {
          creator_id: string;
          product_id: string;
          role: string;
        };
        Insert: {
          creator_id: string;
          product_id: string;
          role: string;
        };
        Update: {
          creator_id?: string;
          product_id?: string;
          role?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'products_creators_creator_id_fkey';
            columns: ['creator_id'];
            isOneToOne: false;
            referencedRelation: 'creators';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'products_creators_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'products';
            referencedColumns: ['id'];
          },
        ];
      };
      profiles: {
        Row: {
          created_at: string;
          display_name: string | null;
          id: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          display_name?: string | null;
          id: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          display_name?: string | null;
          id?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      publishers: {
        Row: {
          created_at: string;
          description: string | null;
          id: string;
          name: string;
          slug: string;
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          id?: string;
          name: string;
          slug: string;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          id?: string;
          name?: string;
          slug?: string;
        };
        Relationships: [];
      };
      semantic_labels: {
        Row: {
          created_at: string;
          description: string | null;
          id: string;
          label: string;
          wikidata_id: string | null;
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          id?: string;
          label: string;
          wikidata_id?: string | null;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          id?: string;
          label?: string;
          wikidata_id?: string | null;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      product_lang: 'fi' | 'sv' | 'en';
      product_type: 'Core Rulebook' | 'Adventure' | 'Supplement' | 'Zine' | 'Quickstart' | 'Other';
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema['Enums']
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema['CompositeTypes']
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      product_lang: ['fi', 'sv', 'en'],
      product_type: ['Core Rulebook', 'Adventure', 'Supplement', 'Zine', 'Quickstart', 'Other'],
    },
  },
} as const;
