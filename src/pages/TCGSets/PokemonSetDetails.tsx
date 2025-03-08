
import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, ExternalLink } from "lucide-react";
import Layout from "@/components/layout/Layout";
import PokemonCardComponent from "@/components/sets/PokemonCardComponent";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import CardDownloadManager from "@/components/sets/CardDownloadManager";

const PokemonSetDetails = () => {
  const { setId } = useParams<{ setId: string }>();
  const [set, setSet] = useState<any>(null);
  const [cards, setCards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingCards, setLoadingCards] = useState(true);

  useEffect(() => {
    const fetchSetDetails = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('pokemon_sets')
          .select('*')
          .eq('set_id', setId)
          .single();

        if (error) throw error;
        setSet(data);
      } catch (error) {
        console.error('Error fetching set details:', error);
      } finally {
        setLoading(false);
      }
    };

    if (setId) {
      fetchSetDetails();
    }
  }, [setId]);

  useEffect(() => {
    const fetchCards = async () => {
      setLoadingCards(true);
      try {
        // Try to fetch cards from our database first
        const { data: dbCards, error: dbError } = await supabase
          .from('pokemon_cards')
          .select('*')
          .eq('set_id', setId)
          .order('number');

        if (!dbError && dbCards && dbCards.length > 0) {
          // We have cards in our database
          console.log(`Found ${dbCards.length} cards in database`);
          
          // Process the cards to match the expected format
          const processedCards = dbCards.map(card => ({
            ...card,
            images: card.images ? JSON.parse(typeof card.images === 'string' ? card.images : JSON.stringify(card.images)) : null,
            attacks: card.attacks ? JSON.parse(typeof card.attacks === 'string' ? card.attacks : JSON.stringify(card.attacks)) : null,
            weaknesses: card.weaknesses ? JSON.parse(typeof card.weaknesses === 'string' ? card.weaknesses : JSON.stringify(card.weaknesses)) : null,
            resistances: card.resistances ? JSON.parse(typeof card.resistances === 'string' ? card.resistances : JSON.stringify(card.resistances)) : null,
            set: { id: card.set_id }
          }));
          
          setCards(processedCards);
          setLoadingCards(false);
          return;
        }
        
        // If no cards in database, fall back to API
        console.log("No cards found in database, using API fallback");
        const apiKey = 'a9394cef-34e4-491c-9bab-65bfea95e064';
        
        const response = await fetch(`https://api.pokemontcg.io/v2/cards?q=set.id:${setId}`, {
          headers: {
            'X-Api-Key': apiKey
          }
        });
        
        if (!response.ok) {
          throw new Error(`API Error: ${response.status} - ${response.statusText}`);
        }
        
        const data = await response.json();
        setCards(data.data);
      } catch (error) {
        console.error('Error fetching cards:', error);
      } finally {
        setLoadingCards(false);
      }
    };

    if (setId) {
      fetchCards();
    }
  }, [setId]);

  if (loading) {
    return (
      <Layout>
        <div className="container py-6">
          <Skeleton className="h-8 w-48 mb-4" />
          <Skeleton className="h-6 w-full max-w-md mb-6" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <Skeleton key={item} className="h-64 w-full rounded-lg" />
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  if (!set) {
    return (
      <Layout>
        <div className="container py-6">
          <h1 className="text-2xl font-bold mb-4">Set Not Found</h1>
          <p>The set you are looking for does not exist or there was an error loading it.</p>
          <Button asChild className="mt-4">
            <Link to="/pokemon-sets">Back to Sets</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-6">
        <Button variant="outline" asChild className="mb-4">
          <Link to="/pokemon-sets" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" /> Back to Sets
          </Link>
        </Button>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card className="md:col-span-2">
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                <div className="w-32 h-32 flex items-center justify-center bg-gray-100 rounded-lg p-4">
                  <img
                    src={set.images_url || set.logo_url || set.symbol_url}
                    alt={`${set.name} symbol`}
                    className="max-w-full max-h-full object-contain"
                    onError={(e) => {
                      e.currentTarget.src = '/placeholder.svg';
                    }}
                  />
                </div>
                <div>
                  <h1 className="text-3xl font-bold">{set.name}</h1>
                  <p className="text-gray-600 mb-2">Series: {set.series}</p>
                  <p className="text-gray-600 mb-2">Released: {set.release_date ? new Date(set.release_date).toLocaleDateString() : 'Unknown'}</p>
                  <p className="text-gray-600 mb-2">Cards: {set.printed_total || set.total || '?'}</p>
                  <div className="flex gap-2 mt-4">
                    <Button asChild variant="outline" size="sm">
                      <a
                        href={`https://www.tcgplayer.com/search/pokemon/product?q=${encodeURIComponent(set.name)}&view=grid`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1"
                      >
                        Shop on TCGPlayer <ExternalLink className="h-3 w-3" />
                      </a>
                    </Button>
                    <Button asChild variant="outline" size="sm">
                      <a
                        href={`https://www.cardmarket.com/en/Pokemon/Products/Singles?searchString=${encodeURIComponent(set.name)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1"
                      >
                        Shop on Cardmarket <ExternalLink className="h-3 w-3" />
                      </a>
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <CardDownloadManager 
                source="pokemon" 
                label="Pokémon" 
                setId={setId}
              />
            </CardContent>
          </Card>
        </div>

        <Separator className="my-6" />

        <h2 className="text-2xl font-bold mb-6">Cards in this Set</h2>

        {loadingCards ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {[...Array(10)].map((_, i) => (
              <Skeleton key={i} className="h-64 w-full rounded-lg" />
            ))}
          </div>
        ) : cards.length === 0 ? (
          <p>No cards found for this set.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {cards.map((card) => (
              <PokemonCardComponent 
                key={card.card_id || card.id} 
                card={card} 
              />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default PokemonSetDetails;
