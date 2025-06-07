

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."create_new_sale"("sale_items" "jsonb"[]) RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
declare
  new_sale_id uuid;
  sale_item jsonb;
  product_id_to_update uuid;
  quantity_to_decrement int;
  total_sale_price numeric := 0;
  total_sale_cost numeric := 0;
  product_record record;
begin
  -- Calculate total price and cost from the items
  foreach sale_item in array sale_items
  loop
    product_id_to_update := (sale_item->>'product_id')::uuid;
    quantity_to_decrement := (sale_item->>'quantity')::int;

    select price, cost into product_record from public.products where id = product_id_to_update;
    
    total_sale_price := total_sale_price + (product_record.price * quantity_to_decrement);
    total_sale_cost := total_sale_cost + (product_record.cost * quantity_to_decrement);
  end loop;

  -- Insert the new sale
  insert into public.sales (user_id, total, profit)
  values (auth.uid(), total_sale_price, total_sale_price - total_sale_cost)
  returning id into new_sale_id;

  -- Insert sale items and update product stock
  foreach sale_item in array sale_items
  loop
    product_id_to_update := (sale_item->>'product_id')::uuid;
    quantity_to_decrement := (sale_item->>'quantity')::int;

    select price into product_record from public.products where id = product_id_to_update;

    insert into public.sale_items (sale_id, product_id, quantity, price_at_sale)
    values (new_sale_id, product_id_to_update, quantity_to_decrement, product_record.price);

    -- Decrement stock
    update public.products
    set stock = stock - quantity_to_decrement
    where id = product_id_to_update;
  end loop;

  return new_sale_id;
end;
$$;


ALTER FUNCTION "public"."create_new_sale"("sale_items" "jsonb"[]) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_z_report_data"("from_date" "text", "to_date" "text") RETURNS TABLE("id" "uuid", "created_at" timestamp with time zone, "total" numeric, "profit" numeric, "sale_items" "jsonb")
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    RETURN QUERY
    SELECT
        s.id,
        s.created_at,
        s.total,
        s.profit,
        COALESCE(
            jsonb_agg(
                jsonb_build_object(
                    'quantity', si.quantity,
                    'products', to_jsonb(p)
                )
            ) FILTER (WHERE si.id IS NOT NULL),
            '[]'::jsonb
        ) AS sale_items
    FROM
        public.sales s
    LEFT JOIN
        public.sale_items si ON s.id = si.sale_id
    LEFT JOIN
        public.products p ON si.product_id = p.id
    WHERE
        s.created_at >= from_date::timestamptz
        AND s.created_at <= to_date::timestamptz
    GROUP BY
        s.id
    ORDER BY
        s.created_at DESC;
END;
$$;


ALTER FUNCTION "public"."get_z_report_data"("from_date" "text", "to_date" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  INSERT INTO public.users (id, email, name, username)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'username');
  RETURN new;
END;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."products" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" character varying(255) NOT NULL,
    "description" "text",
    "price" numeric(10,2) NOT NULL,
    "cost" numeric(10,2) NOT NULL,
    "stock" integer DEFAULT 0 NOT NULL,
    "category" character varying(100),
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."products" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."sale_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "sale_id" "uuid",
    "product_id" "uuid",
    "quantity" integer NOT NULL,
    "price_at_sale" numeric(10,2) NOT NULL
);


ALTER TABLE "public"."sale_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."sales" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "total" numeric(10,2) NOT NULL,
    "profit" numeric(10,2) NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."sales" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."users" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "username" character varying(255) NOT NULL,
    "email" character varying(255) NOT NULL,
    "password_hash" character varying(255) NOT NULL,
    "role" character varying(50) DEFAULT 'user'::character varying NOT NULL,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."users" OWNER TO "postgres";


ALTER TABLE ONLY "public"."products"
    ADD CONSTRAINT "products_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."sale_items"
    ADD CONSTRAINT "sale_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."sales"
    ADD CONSTRAINT "sales_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_username_key" UNIQUE ("username");



ALTER TABLE ONLY "public"."sale_items"
    ADD CONSTRAINT "sale_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id");



ALTER TABLE ONLY "public"."sale_items"
    ADD CONSTRAINT "sale_items_sale_id_fkey" FOREIGN KEY ("sale_id") REFERENCES "public"."sales"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."sales"
    ADD CONSTRAINT "sales_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id");



CREATE POLICY "Allow admins to manage products" ON "public"."products" USING ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND (("users"."role")::"text" = 'admin'::"text"))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND (("users"."role")::"text" = 'admin'::"text")))));



CREATE POLICY "Allow all authenticated users to read products" ON "public"."products" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Allow users to insert sale_items for their sales" ON "public"."sale_items" FOR INSERT WITH CHECK (("sale_id" IN ( SELECT "sales"."id"
   FROM "public"."sales"
  WHERE ("sales"."user_id" = "auth"."uid"()))));



CREATE POLICY "Allow users to insert their own sales" ON "public"."sales" FOR INSERT WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "Allow users to read sale_items for their sales" ON "public"."sale_items" FOR SELECT USING (("sale_id" IN ( SELECT "sales"."id"
   FROM "public"."sales"
  WHERE ("sales"."user_id" = "auth"."uid"()))));



CREATE POLICY "Allow users to read their own profile" ON "public"."users" FOR SELECT USING (("id" = "auth"."uid"()));



CREATE POLICY "Allow users to read their own sales" ON "public"."sales" FOR SELECT USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Allow users to update their own profile" ON "public"."users" FOR UPDATE USING (("id" = "auth"."uid"())) WITH CHECK (("id" = "auth"."uid"()));



CREATE POLICY "Enable delete for authenticated users" ON "public"."products" FOR DELETE TO "authenticated" USING (true);



CREATE POLICY "Enable insert for authenticated users" ON "public"."products" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Enable read access for all authenticated users" ON "public"."products" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Enable update for authenticated users" ON "public"."products" FOR UPDATE TO "authenticated" USING (true) WITH CHECK (true);



ALTER TABLE "public"."products" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."sale_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."sales" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."users" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";
GRANT USAGE ON SCHEMA "public" TO "supabase_auth_admin";

























































































































































GRANT ALL ON FUNCTION "public"."create_new_sale"("sale_items" "jsonb"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."create_new_sale"("sale_items" "jsonb"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_new_sale"("sale_items" "jsonb"[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_z_report_data"("from_date" "text", "to_date" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_z_report_data"("from_date" "text", "to_date" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_z_report_data"("from_date" "text", "to_date" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "supabase_auth_admin";


















GRANT ALL ON TABLE "public"."products" TO "anon";
GRANT ALL ON TABLE "public"."products" TO "authenticated";
GRANT ALL ON TABLE "public"."products" TO "service_role";



GRANT ALL ON TABLE "public"."sale_items" TO "anon";
GRANT ALL ON TABLE "public"."sale_items" TO "authenticated";
GRANT ALL ON TABLE "public"."sale_items" TO "service_role";



GRANT ALL ON TABLE "public"."sales" TO "anon";
GRANT ALL ON TABLE "public"."sales" TO "authenticated";
GRANT ALL ON TABLE "public"."sales" TO "service_role";



GRANT ALL ON TABLE "public"."users" TO "anon";
GRANT ALL ON TABLE "public"."users" TO "authenticated";
GRANT ALL ON TABLE "public"."users" TO "service_role";
GRANT SELECT ON TABLE "public"."users" TO "supabase_auth_admin";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";






























RESET ALL;
