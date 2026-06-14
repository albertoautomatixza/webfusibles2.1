/*
  # Create Products and Banners Tables for Google Sheets Integration

  1. New Tables
    - `banners`
      - `id` (uuid, primary key) - Unique identifier
      - `banner_url` (text) - URL of banner image (recommended: 1200x600px)
      - `titulo` (text) - Banner title text
      - `orden` (integer) - Display order
      - `activo` (boolean) - Whether banner is active
      - `created_at` (timestamptz) - Creation timestamp
      - `updated_at` (timestamptz) - Last update timestamp

    - `productos`
      - `id` (uuid, primary key) - Unique identifier
      - `categoria` (text) - Product category (e.g., "Componentes", "Medición")
      - `imagen_url` (text) - URL of product image (recommended: 800x520px)
      - `nombre` (text) - Product name
      - `descripcion` (text) - Product description
      - `orden` (integer) - Display order within category
      - `activo` (boolean) - Whether product is active
      - `created_at` (timestamptz) - Creation timestamp
      - `updated_at` (timestamptz) - Last update timestamp

  2. Security
    - Enable RLS on both tables
    - Add policies for public read access (anyone can view)
    - Add policies for authenticated users to manage content

  3. Indexes
    - Add index on `activo` and `orden` for efficient queries
    - Add index on `categoria` for filtering products
*/

-- Create banners table
CREATE TABLE IF NOT EXISTS banners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  banner_url text NOT NULL,
  titulo text NOT NULL,
  orden integer NOT NULL DEFAULT 0,
  activo boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create productos table
CREATE TABLE IF NOT EXISTS productos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  categoria text NOT NULL,
  imagen_url text NOT NULL,
  nombre text NOT NULL,
  descripcion text NOT NULL,
  orden integer NOT NULL DEFAULT 0,
  activo boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE productos ENABLE ROW LEVEL SECURITY;

-- Policies for public read access (anyone can view banners and products)
CREATE POLICY "Anyone can view active banners"
  ON banners FOR SELECT
  USING (activo = true);

CREATE POLICY "Anyone can view active productos"
  ON productos FOR SELECT
  USING (activo = true);

-- Policies for authenticated users to manage content
CREATE POLICY "Authenticated users can insert banners"
  ON banners FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update banners"
  ON banners FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete banners"
  ON banners FOR DELETE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert productos"
  ON productos FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update productos"
  ON productos FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete productos"
  ON productos FOR DELETE
  TO authenticated
  USING (true);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_banners_activo_orden ON banners(activo, orden);
CREATE INDEX IF NOT EXISTS idx_productos_activo_orden ON productos(activo, categoria, orden);
CREATE INDEX IF NOT EXISTS idx_productos_categoria ON productos(categoria);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers to auto-update updated_at
DROP TRIGGER IF EXISTS update_banners_updated_at ON banners;
CREATE TRIGGER update_banners_updated_at
  BEFORE UPDATE ON banners
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_productos_updated_at ON productos;
CREATE TRIGGER update_productos_updated_at
  BEFORE UPDATE ON productos
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
