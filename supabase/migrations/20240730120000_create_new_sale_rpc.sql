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