
// Database Operations Module

// Save sets to the database
export async function saveSets(supabase: any, source: string, sets: any[], jobId: string, updateJobStatus: Function) {
  console.log(`Saving ${sets.length} ${source} sets to the database...`);
  
  // Update job status
  await updateJobStatus(supabase, jobId, 'saving_to_database', 50, sets.length, 0);
  
  let tableName = "";
  
  switch (source) {
    case "pokemon":
      tableName = "pokemon_sets";
      break;
    case "mtg":
      tableName = "mtg_sets";
      break;
    case "yugioh":
      tableName = "yugioh_sets";
      break;
    case "lorcana":
      tableName = "lorcana_sets";
      break;
    default:
      throw new Error(`Unknown source: ${source}`);
  }
  
  // Process sets in batches to avoid overloading the database
  const batchSize = 20;
  let processedCount = 0;
  
  for (let i = 0; i < sets.length; i += batchSize) {
    const batch = sets.slice(i, i + batchSize);
    
    const { error } = await supabase
      .from(tableName)
      .upsert(batch, { onConflict: 'set_id' });
      
    if (error) {
      console.error(`Error saving ${source} sets batch:`, error);
      throw error;
    }
    
    processedCount += batch.length;
    const progress = Math.floor((processedCount / sets.length) * 100);
    
    // Update job progress
    await updateJobStatus(supabase, jobId, 'saving_to_database', progress, sets.length, processedCount);
  }
  
  console.log(`Successfully saved ${sets.length} ${source} sets`);
}
