const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://yxawhmhpcvyalferfska.supabase.co';
const supabaseKey = 'sb_publishable_wDoKMqTLlgPANo5gQAI1Sw_E0-eMzoV';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  console.log('Pinging Supabase Database...');

  // Check the admin_users table you just created
  const { data, error } = await supabase
    .from('admin_users')
    .select('*');

  if (error) {
    console.error('\\n❌ CONNECTION FAILED:');
    console.error(error.message);
    if (error.code === '42P01') {
      console.log('Hint: The tables do not exist yet. Did you run the SQL code in the Supabase Dashboard?');
    }
  } else {
    console.log('\\n✅ CONNECTION SUCCESSFUL!');
    console.log('The database responded perfectly. Here is what is inside your admin_users table:');
    console.log(data);
  }
}

testConnection();
