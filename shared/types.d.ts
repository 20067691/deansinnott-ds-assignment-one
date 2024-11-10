// export type Language = 'English' | 'Frenc

export type CraftBeer = {
  id: number;               // Unique identifier for each beer
  name: string;             // Name of the beer
  release_date: string;     // Release date of the beer in ISO format (e.g., 'YYYY-MM-DD')
  description: string;      // Description of the beer's flavor profile
  abv: number;              // Alcohol by volume as a percentage
  brewery: string;          // Name of the brewery that produced the beer
  style: string;            // Style of the beer (e.g., IPA, Stout, Amber Ale)
  rating: number;           // Average rating from users out of 5
};

export type SignUpBody = {
  username: string;
  password: string;
  email: string
}

export type ConfirmSignUpBody = {
  username: string;
  code: string;
}

export type SignInBody = {
  username: string;
  password: string;
}

 