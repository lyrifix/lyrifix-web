import { Music, PlusIcon } from "lucide-react";
import { Link, redirect } from "react-router";

import { Button } from "~/components/ui/button";
import { SongCard } from "~/components/song-card";
import { $fetch } from "~/lib/fetch";
import type { paths } from "~/schema";
import { destroySession, getSession } from "~/sessions.server";
import type { Route } from "./+types/library";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Library Lyrifix" }];
}

type SuccessResponse =
  paths["/library"]["get"]["responses"][200]["content"]["application/json"];

export async function loader({ request }: Route.LoaderArgs) {
  const session = await getSession(request.headers.get("Cookie"));
  const token = session.get("token");
  if (!session.has("token") || !token) return redirect("/login");

  const { data: library, error } = await $fetch<SuccessResponse>("/library", {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (error) {
    session.flash("error", "Failed to load your library");
    return redirect("/login", {
      headers: { "Set-Cookie": await destroySession(session) },
    });
  }

  return { library };
}

export default function LibraryRoute({ loaderData }: Route.ComponentProps) {
  const { library } = loaderData;

  if (!library) return null;

  return (
    <div className="space-y-6 text-white">
      {/* Header Section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Your Library</h1>
          <p className="text-lg text-gray-300">
            Welcome back, {library.user.fullName}!
          </p>
          <p className="text-sm text-gray-400">
            {library.songs.length}{" "}
            {library.songs.length === 1 ? "song" : "songs"} in your collection
          </p>
        </div>
      </div>

      {/* Library Grid */}
      {library.songs.length === 0 ? (
        <div className="py-12 text-center">
          <Music className="mx-auto mb-4 h-16 w-16 text-gray-400" />
          <h3 className="mb-2 text-xl font-semibold text-gray-300">
            Your library is empty
          </h3>
          <p className="mb-6 text-gray-400">
            Start building your collection by adding your first song
          </p>
          <Link to="/add-song">
            <Button className="bg-pink-600 hover:bg-pink-700">
              <PlusIcon className="mr-2 h-4 w-4" />
              Add Your First Song
            </Button>
          </Link>
        </div>
      ) : (
        <ul className="grid grid-cols-1 items-stretch gap-4 md:grid-cols-2 lg:grid-cols-2">
          {/* Add Song Card */}
          <li className="flex h-full flex-col">
            <Link to="/add-song" className="flex h-full flex-1 flex-col">
              <div className="group flex h-full flex-col rounded-lg border-2 border-dashed border-pink-500/50 bg-gray-800/50 p-6 transition-all duration-200 hover:scale-105 hover:border-pink-500 hover:bg-gray-800">
                <div className="flex flex-1 flex-col items-center justify-center">
                  <PlusIcon className="h-8 w-8 text-pink-400 transition-colors group-hover:text-pink-300" />
                  <span className="mt-2 text-sm font-medium text-pink-400 group-hover:text-pink-300">
                    Add New Song
                  </span>
                </div>
              </div>
            </Link>
          </li>

          {/* Song Cards */}
          {library.songs.map((song) => (
            <li key={song.id} className="flex h-full flex-col">
              <Link
                to={`/songs/${song.slug}`}
                className="flex h-full flex-1 flex-col"
              >
                <SongCard song={song} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
