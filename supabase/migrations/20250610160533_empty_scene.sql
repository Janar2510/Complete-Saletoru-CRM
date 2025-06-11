/*
  # Fix missing foreign key relationship between contacts and users

  1. Foreign Key Constraints
    - Add missing foreign key constraint for contacts.owner_id -> users.id
    - This will allow proper joins between contacts and users tables

  2. Security
    - No changes to RLS policies needed as they already exist
*/

-- Add the missing foreign key constraint for contacts.owner_id
DO $$
BEGIN
  -- Check if the foreign key constraint doesn't already exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'contacts_owner_id_fkey' 
    AND table_name = 'contacts'
  ) THEN
    -- Add the foreign key constraint
    ALTER TABLE public.contacts 
    ADD CONSTRAINT contacts_owner_id_fkey 
    FOREIGN KEY (owner_id) REFERENCES public.users(id);
  END IF;
END $$;