import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

async function debugProjectData() {
    // Find Orion McKinney
    const { data: project } = await supabase
        .from('projects')
        .select('id, property_name, user_id')
        .eq('property_name', 'Orion McKinney')
        .single();

    if (!project) {
        console.error('Project Orion McKinney not found');
        return;
    }

    console.log(`Found Project: ${project.property_name} (${project.id})`);
    console.log(`Project Owner ID: ${project.user_id}`);

    const { data: users } = await supabase.auth.admin.listUsers();
    console.log('All Users:');
    users.users.forEach(u => console.log(`- ${u.email} (${u.id})`));

    // Fetch full data like the page does
    const { data: fullProject, error } = await supabase
        .from('projects')
        .select(`
      *,
      invoice_data (*),
      optimizations (*),
      analysis_jobs (*)
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
    }
}

debugProjectData().catch(console.error);
