const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://yxawhmhpcvyalferfska.supabase.co';
const supabaseKey = 'sb_publishable_wDoKMqTLlgPANo5gQAI1Sw_E0-eMzoV';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testContact() {
  console.log('Testing contact insert...');
  const { data, error } = await supabase.from('contacts').insert({
      first_name: 'Test',
      last_name: 'User',
      email: 'test@example.com',
      service: 'Web Architecture',
      company: 'Test Corp',
      preferred_time: 'Now',
      message: 'Testing',
      created_at: new Date().toISOString()
  });
  if (error) {
    console.error('ERROR POSTING CONTACT:', error);
  } else {
    console.log('SUCCESS POSTING CONTACT:', data);
  }
}
testContact();
