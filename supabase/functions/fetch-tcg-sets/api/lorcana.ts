
// Disney Lorcana API module (hardcoded as there's no official API)

// Add custom Lorcana sets - these are hardcoded since there's no official API
export async function fetchLorcanaSets() {
  console.log("Adding Disney Lorcana sets...");
  
  // Hardcoded list of Lorcana sets
  const lorcanaSets = [
    {
      set_id: "tfc",
      name: "The First Chapter",
      release_date: "2023-08-18",
      set_code: "TFC",
      total_cards: 204,
      set_image: "https://lorcana.com/wp-content/uploads/2023/09/Core-Set-The-First-Chapter-Cardback-Banner-1.jpg",
      set_type: "Core Set"
    },
    {
      set_id: "rit",
      name: "Rise of the Floodborn",
      release_date: "2023-12-01",
      set_code: "RIT",
      total_cards: 204,
      set_image: "https://lorcana.com/wp-content/uploads/2023/11/Rise-of-the-Floodborn-Cardback-Banner-1.jpg",
      set_type: "Core Set"
    },
    {
      set_id: "faz",
      name: "Into the Inklands",
      release_date: "2024-02-16",
      set_code: "ITI",
      total_cards: 204,
      set_image: "https://lorcana.com/wp-content/uploads/2024/02/ITI-Promo-Featured-Image-Desktop.jpg",
      set_type: "Core Set"
    },
    {
      set_id: "aur",
      name: "Ursula's Return",
      release_date: "2024-05-17",
      set_code: "AUR",
      total_cards: 204,
      set_image: "https://lorcana.com/wp-content/uploads/2024/05/Ursulas-Return-Desktop-Banner-3960x2380.jpg",
      set_type: "Core Set"
    }
  ];
  
  return lorcanaSets;
}
