import type { Route } from "./+types/home";
import { Banner } from "~/components/banner";
import { SongCard } from "~/components/song-card";
import { Link } from "react-router";
import type { Songs } from "~/schemas/song";
import { apiFetch } from "~/utils/api";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Lyrifix" },
    { name: "description", content: "Fix the lyric, Feel the music." },
  ];
}

export async function loader({}: Route.LoaderArgs) {
  const songs: Songs = await apiFetch<Songs>("/songs");
  return songs;
}

export default function Home({ loaderData }: Route.ComponentProps) {
  const songs = loaderData;

  return (
    <>
      <Banner />

      <ul className="grid grid-cols-1 items-stretch gap-4 md:grid-cols-2 lg:grid-cols-2">
        {songs.map((song) => (
          <li key={song.id} className="flex h-full flex-col">
            <Link
              to={`/songs/${song.slug}`}
              className="flex h-full flex-1 flex-col"
            >
              <SongCard key={song.id} song={song} />
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
