-- Supabase RPC to handle creating a sale and updating inventory atomically

create or replace function create_new_sale(
    sale_items jsonb[]
)
returns uuid as $$
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
$$ language plpgsql volatile security definer;

-- Function to get Z-report data
CREATE OR REPLACE FUNCTION get_z_report_data(
    from_date text,
    to_date text
)
RETURNS TABLE(
    id uuid,
    created_at timestamptz,
    total numeric,
    profit numeric,
    sale_items jsonb
) AS $$
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
$$ LANGUAGE plpgsql; 