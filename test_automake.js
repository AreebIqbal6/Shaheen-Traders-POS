import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envContent = fs.readFileSync('.env', 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    env[parts[0].trim()] = parts.slice(1).join('=').trim();
  }
});

const supabaseUrl = env['VITE_SUPABASE_URL'];
const supabaseKey = env['VITE_SUPABASE_ANON_KEY'];

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  // 1. Insert a mock B2B order in PENDING status
  const idempotencyKey = 'test-idemp-' + Math.random();
  const receiptNumber = 'TEST-ORD-' + Math.floor(100000 + Math.random() * 900000);
  
  console.log('Inserting mock order...');
  const { data: insertData, error: insertError } = await supabase.from('orders').insert({
    receipt_number: receiptNumber,
    idempotency_key: idempotencyKey,
    client_name: 'Test AutoMake Shop',
    total: 500,
    status: 'PENDING',
    items: [
      {
        id: '28',
        name: 'Shan Fresh Bread',
        price: 161,
        quantity: 1
      }
    ]
  }).select();
  
  if (insertError) {
    console.error('Insert failed:', insertError);
    return;
  }
  
  const order = insertData[0];
  console.log('Inserted order:', order);

  // 2. Fetch orders (like fetchOrders on mount)
  console.log('Fetching orders (initial)...');
  let { data: ordersInitial } = await supabase.from('orders').select('*').in('status', ['PENDING', 'ACCEPTED', 'PROCESSING']);
  console.log('Initial fetch contains our order:', ordersInitial.some(o => o.id === order.id));

  // 3. Update status to PROCESSING (like handleAcceptOrder does)
  console.log('Updating order status to PROCESSING...');
  const { error: updateError } = await supabase.from('orders').update({ status: 'PROCESSING' }).eq('id', order.id);
  if (updateError) {
    console.error('Update failed:', updateError);
  }

  // 4. Fetch orders again (like fetchOrders after real-time update)
  console.log('Fetching orders again...');
  let { data: ordersAfterUpdate } = await supabase.from('orders').select('*').in('status', ['PENDING', 'ACCEPTED', 'PROCESSING']);
  console.log('After update fetch contains our order:', ordersAfterUpdate.some(o => o.id === order.id));
  
  if (ordersAfterUpdate.some(o => o.id === order.id)) {
     const fetchedOrder = ordersAfterUpdate.find(o => o.id === order.id);
     console.log('Fetched order details:', fetchedOrder);
  }

  // 5. Clean up: Delete the test order
  console.log('Cleaning up...');
  await supabase.from('orders').delete().eq('id', order.id);
  console.log('Done!');
}

run();
