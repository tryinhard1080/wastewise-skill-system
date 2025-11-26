import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

async function verify() {
    const { count: projectCount } = await supabase.from('projects').select('*', { count: 'exact', head: true });
    const { count: invoiceCount } = await supabase.from('invoice_data').select('*', { count: 'exact', head: true });

    console.log(`Projects: ${projectCount}`);
    console.log(`Invoices: ${invoiceCount}`);

    const { data: projects } = await supabase.from('projects').select('property_name, units');
    console.log('Projects:', projects?.map(p => `${p.property_name} (${p.units})`).join(', '));
}

verify().catch(console.error);
