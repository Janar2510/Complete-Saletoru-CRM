/*
  # Fix Activities and Products Tables

  1. Database Schema Updates
    - Add foreign key relationship between contact_activities and auth.users
    - Create products table with all necessary columns
    - Set up proper RLS policies for products table

  2. Security
    - Enable RLS on products table
    - Add policies for authenticated users to manage products
*/

-- First, let's add the missing foreign key relationship for contact_activities
DO $$
BEGIN
  -- Check if the foreign key doesn't already exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'contact_activities_created_by_fkey' 
    AND table_name = 'contact_activities'
  ) THEN
    ALTER TABLE contact_activities 
    ADD CONSTRAINT contact_activities_created_by_fkey 
    FOREIGN KEY (created_by) REFERENCES auth.users(id);
  END IF;
END $$;

-- Create products table if it doesn't exist
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  sku text NOT NULL UNIQUE,
  price numeric(15,2) NOT NULL DEFAULT 0,
  cost numeric(15,2) DEFAULT 0,
  category text,
  tags text[] DEFAULT '{}',
  status text DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'discontinued')),
  inventory_count integer DEFAULT 0,
  image_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

-- Enable RLS on products table
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Add RLS policies for products
CREATE POLICY "Users can create products"
  ON products
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can read all products"
  ON products
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update products they created"
  ON products
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by);

CREATE POLICY "Users can delete products they created"
  ON products
  FOR DELETE
  TO authenticated
  USING (auth.uid() = created_by);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_products_created_by ON products(created_by);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at);

-- Add updated_at trigger for products
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();