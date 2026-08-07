export type ProfileRow = {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
  updated_at: string;
};

export type ProfileUpdateInput = {
  first_name: string;
  last_name: string;
  phone: string;
};
