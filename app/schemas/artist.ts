import { z } from "zod";

export const ArtistSchema = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
  imageUrl: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const CreateArtistSchema = ArtistSchema.omit({
  createdAt: true,
  updatedAt: true,
});

export type Artist = z.infer<typeof ArtistSchema>;
