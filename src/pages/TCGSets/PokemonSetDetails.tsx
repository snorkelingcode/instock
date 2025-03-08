import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tables } from "@/integrations/supabase/types";
import { getCache, setCache } from "@/utils/cacheUtils";

// Define the Pokemon Set type
interface PokemonSet extends Tables<"pokemon_sets"> {
  // Add any additional properties not in the database schema
  cards?: any[];
}

const PokemonSetDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [set, setSet] = useState<PokemonSet | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cache configuration
  const CACHE_PARTITION = "pokemon_sets";
  const CACHE_KEY = `set_${id}`;
  const CACHE_DURATION_MINUTES = 60; // Cache for 1 hour

  useEffect(() => {
    const fetchSetDetails = async () => {
      if (!id) {
        setError("Set ID is required");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        // Try to get from cache first
        const cachedSet = getCache<PokemonSet>(CACHE_KEY, CACHE_PARTITION);
        if (cachedSet) {
          setSet(cachedSet);
          setLoading(false);
          return;
        }

        // If not in cache, fetch from database
        const { data, error } = await supabase
          .from("pokemon_sets")
          .select("*")
          .eq('set_id', id as any)
          .single();

        if (error) {
          throw error;
        }

        if (data) {
          const setData = data as PokemonSet;
          setSet(setData);
          
          // Cache the result
          setCache(CACHE_KEY, setData, CACHE_DURATION_MINUTES, CACHE_PARTITION);
        } else {
          setError("Set not found");
        }
      } catch (err: any) {
        console.error("Error fetching set details:", err);
        setError(err.message || "Failed to load set details");
      } finally {
        setLoading(false);
      }
    };

    fetchSetDetails();
  }, [id]);

  const handleBack = () => {
    navigate(-1);
  };

  const formatReleaseDate = (dateString: string | null) => {
    if (!dateString) return "Unknown";
    
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto py-8">
          <Button variant="ghost" className="mb-4" onClick={handleBack}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-1">
              <Skeleton className="h-80 w-full rounded-lg" />
            </div>
            <div className="md:col-span-2 space-y-4">
              <Skeleton className="h-10 w-3/4" />
              <Skeleton className="h-6 w-1/2" />
              <Skeleton className="h-6 w-1/3" />
              <Skeleton className="h-24 w-full" />
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (error || !set) {
    return (
      <Layout>
        <div className="container mx-auto py-8">
          <Button variant="ghost" className="mb-4" onClick={handleBack}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
          
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <h2 className="text-2xl font-bold text-red-600 mb-2">Error</h2>
                <p className="text-gray-700">{error || "Set not found"}</p>
                <Button className="mt-4" onClick={handleBack}>
                  Go Back
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto py-8">
        <Button variant="ghost" className="mb-4" onClick={handleBack}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Set Image */}
          <div className="md:col-span-1">
            {set.images_url ? (
              <img 
                src={set.images_url} 
                alt={set.name} 
                className="w-full rounded-lg shadow-md"
              />
            ) : (
              <div className="w-full h-80 bg-gray-200 rounded-lg flex items-center justify-center">
                <p className="text-gray-500">No image available</p>
              </div>
            )}
            
            {set.logo_url && (
              <img 
                src={set.logo_url} 
                alt={`${set.name} logo`} 
                className="mt-4 w-full rounded-lg shadow-md"
              />
            )}
          </div>
          
          {/* Set Details */}
          <div className="md:col-span-2">
            <h1 className="text-3xl font-bold mb-2">{set.name}</h1>
            <p className="text-gray-600 mb-4">
              {set.series && `Series: ${set.series}`}
            </p>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Release Date</h3>
                <p className="text-lg">{formatReleaseDate(set.release_date)}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Total Cards</h3>
                <p className="text-lg">{set.total || set.printed_total || "Unknown"}</p>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2 mb-6">
              {set.symbol_url && (
                <div className="flex items-center">
                  <img 
                    src={set.symbol_url} 
                    alt="Set Symbol" 
                    className="h-8 w-8 mr-2"
                  />
                  <span className="text-sm text-gray-600">Set Symbol</span>
                </div>
              )}
            </div>
            
            <div className="mt-8">
              <h2 className="text-xl font-semibold mb-4">About This Set</h2>
              <p className="text-gray-700">
                {set.name} is a Pokémon TCG expansion with {set.total || set.printed_total || "an unknown number of"} cards.
                {set.series && ` It is part of the ${set.series} series.`}
                {set.release_date && ` Released on ${formatReleaseDate(set.release_date)}.`}
              </p>
              
              <div className="mt-6">
                <Button variant="outline" className="flex items-center gap-2">
                  <ExternalLink className="h-4 w-4" />
                  View on Pokémon TCG Website
                </Button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Cards section would go here */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold mb-6">Cards in this Set</h2>
          <p className="text-gray-700">
            Card data for this set is not yet available. Check back later for a complete card listing.
          </p>
        </div>
      </div>
    </Layout>
  );
};

export default PokemonSetDetails;
