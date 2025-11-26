import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

async function debugSpringsData() {
    // Find Springs at Alta Mesa
    const { data: project } = await supabase
        .from('projects')
        .select('id, property_name')
        .ilike('property_name', '%Springs at Alta Mesa%')
        .single();

    if (!project) {
        console.error('Project Springs at Alta Mesa not found');
        return;
    }

    console.log(`Found Project: ${project.property_name} (${project.id})`);

    // Fetch full data
    const { data: fullProject, error } = await supabase
        .from('projects')
        .select(`
      *,
      invoice_data (*)
    `)
        .eq('id', project.id)
        .single();

    if (error) {
        console.error('Error fetching full project:', error);
        return;
    }

    console.log('--- Invoice Data ---');
    console.log(`Count: ${fullProject.invoice_data.length}`);
    if (fullProject.invoice_data.length > 0) {
        console.log('Sample Invoice:', JSON.stringify(fullProject.invoice_data[0], null, 2));
    } else {
        console.log('NO INVOICES FOUND. This explains why it is blank.');
    }
}

debugSpringsData().catch(console.error);
