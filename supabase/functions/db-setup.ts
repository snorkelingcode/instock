
// Function to create RPC functions for database setup if needed
export async function createRpcFunctionsIfNeeded(supabase) {
  try {
    console.log("Creating RPC functions if needed...");
    
    // Function to create rate limit table
    const createRateLimitTableFn = `
      CREATE OR REPLACE FUNCTION create_rate_limit_table_if_not_exists()
      RETURNS void AS $$
      BEGIN
        CREATE TABLE IF NOT EXISTS public.api_rate_limits (
          id SERIAL PRIMARY KEY,
          api_key TEXT UNIQUE NOT NULL,
          last_accessed TIMESTAMP WITH TIME ZONE NOT NULL,
          expires_at TIMESTAMP WITH TIME ZONE NOT NULL
        );
      END;
      $$ LANGUAGE plpgsql;
    `;
    
    // Function to create job status table
    const createJobStatusTableFn = `
      CREATE OR REPLACE FUNCTION create_job_status_table_if_not_exists()
      RETURNS void AS $$
      BEGIN
        CREATE TABLE IF NOT EXISTS public.api_job_status (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          job_id TEXT UNIQUE NOT NULL,
          source TEXT NOT NULL,
          status TEXT NOT NULL,
          progress NUMERIC DEFAULT 0,
          total_items NUMERIC DEFAULT 0,
          completed_items NUMERIC DEFAULT 0,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
          completed_at TIMESTAMP WITH TIME ZONE,
          error TEXT,
          current_chunk INT DEFAULT 0,
          chunk_size INT DEFAULT 10
        );
      END;
      $$ LANGUAGE plpgsql;
    `;
    
    // Execute the functions
    const { error: err1 } = await supabase.rpc('create_rate_limit_table_if_not_exists').catch(async () => {
      console.log("Creating rate limit table function...");
      return await supabase.sql(createRateLimitTableFn);
    });
    
    const { error: err2 } = await supabase.rpc('create_job_status_table_if_not_exists').catch(async () => {
      console.log("Creating job status table function...");
      return await supabase.sql(createJobStatusTableFn);
    });
    
    if (err1 || err2) {
      console.error("Error creating RPC functions:", err1 || err2);
    } else {
      console.log("RPC functions created or already exist");
    }
  } catch (error) {
    console.error("Error in createRpcFunctionsIfNeeded:", error);
  }
}
