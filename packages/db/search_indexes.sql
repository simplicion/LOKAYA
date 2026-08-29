-- Create the pg_trgm extension if it doesn't exist
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create GIN indexes for Product search
CREATE INDEX IF NOT EXISTS product_name_trgm_idx ON "Product" USING gin(name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS product_description_trgm_idx ON "Product" USING gin(description gin_trgm_ops);
CREATE INDEX IF NOT EXISTS product_category_trgm_idx ON "Product" USING gin(category gin_trgm_ops);
CREATE INDEX IF NOT EXISTS product_brand_trgm_idx ON "Product" USING gin(brand gin_trgm_ops);

-- Create GIN indexes for Store search
CREATE INDEX IF NOT EXISTS store_name_trgm_idx ON "Store" USING gin(name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS store_title_trgm_idx ON "Store" USING gin(title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS store_category_trgm_idx ON "Store" USING gin(category gin_trgm_ops);
CREATE INDEX IF NOT EXISTS store_handle_trgm_idx ON "Store" USING gin(handle gin_trgm_ops);

-- Create GIN indexes for User search
CREATE INDEX IF NOT EXISTS user_name_trgm_idx ON "User" USING gin(name gin_trgm_ops);
