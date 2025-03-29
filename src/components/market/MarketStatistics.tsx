
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Database, BarChart, Users, Star } from "lucide-react";
import { MarketDataItem } from "@/services/marketDataService";

interface MarketStatisticsProps {
  marketData: MarketDataItem[];
}

const formatCurrency = (value: number): string => {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(2)}M`;
  } else if (value >= 1000) {
    return `$${(value / 1000).toFixed(1)}K`;
  }
  return `$${value.toFixed(0)}`;
};

const formatNumber = (value: number): string => {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(2)}M`;
  } else if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`;
  }
  return value.toLocaleString();
};

const MarketStatistics: React.FC<MarketStatisticsProps> = ({ marketData }) => {
  // Calculate total market cap
  const totalMarketCap = marketData.reduce(
    (sum, card) => sum + (card.market_cap || 0), 
    0
  );

  // Calculate total population
  const totalPopulation = marketData.reduce(
    (sum, card) => sum + (card.total_population || 0), 
    0
  );

  // Calculate total PSA 10s
  const totalPsa10s = marketData.reduce(
    (sum, card) => sum + (card.population_10 || 0), 
    0
  );

  // Calculate gem rate (population of PSA 10 / total population)
  const gemRate = totalPopulation > 0 
    ? ((totalPsa10s / totalPopulation) * 100).toFixed(1) 
    : "0";

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Market Cap</CardTitle>
          <BarChart className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(totalMarketCap)}</div>
          <p className="text-xs text-muted-foreground">
            Value of all graded cards
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Population</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatNumber(totalPopulation)}</div>
          <p className="text-xs text-muted-foreground">
            Number of graded cards
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">PSA 10 Population</CardTitle>
          <Star className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatNumber(totalPsa10s)}</div>
          <p className="text-xs text-muted-foreground">
            Perfect condition cards
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Gem Rate</CardTitle>
          <Database className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{gemRate}%</div>
          <p className="text-xs text-muted-foreground">
            PSA 10 / Total population
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default MarketStatistics;
