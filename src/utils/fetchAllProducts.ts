import { supabase } from '../lib/supabase';

export async function fetchAllProducts() {
  let allData: any[] = [];
  let from = 0;
  const step = 1000;
  
  while (true) {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .range(from, from + step - 1)
      .order('created_at', { ascending: false })
      .order('id', { ascending: true });

    if (error) {
      console.error("Error fetching paginated products", error);
      throw error;
    }

    if (data && data.length > 0) {
      allData = [...allData, ...data];
      from += step;
      if (data.length < step) {
        break; // we fetched less than a full page, so we are done
      }
    } else {
      break; // no more data
    }
  }

  return allData;
}
