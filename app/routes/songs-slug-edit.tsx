import { $fetch, createAuthFetch } from "~/lib/fetch";
import type { paths } from "~/schema";
import type { Route } from "./+types/songs-slug-edit";
import { UpdateSongSchema } from "~/schemas/song";
import { parseWithZod } from "@conform-to/zod";
import {
  getFormProps,
  getInputProps,
  useForm,
  useInputControl,
} from "@conform-to/react";
import { useState } from "react";
import type { Option } from "~/components/ui/multiselect";
import { Form, href, redirect, useNavigation } from "react-router";
import { SingleFileUploader } from "~/components/single-uploadcare";
import { Input } from "~/components/ui/input";
import { MultiselectArtists } from "~/components/multiselect-artists";
import { Button } from "~/components/ui/button";
import { getSession } from "~/sessions.server";

type SongSuccessResponse =
  paths["/songs/{slug}"]["get"]["responses"][200]["content"]["application/json"];
type ArtistsSuccessResponse =
  paths["/artists"]["get"]["responses"][200]["content"]["application/json"];
type ActionSuccessResponse = {
  song: paths["/songs/{id}"]["patch"]["responses"][200]["content"]["application/json"];
};

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Lyrifix - Edit Song" },
    {
      name: "description",
      content: "Edit song",
    },
  ];
}

export async function loader({ params, request }: Route.LoaderArgs) {
  const { slug } = params;

  const [songResponse, artistsResponse] = await Promise.all([
    $fetch<SongSuccessResponse>("/songs/:slug", {
      params: { slug },
    }),
    $fetch<ArtistsSuccessResponse>("/artists"),
  ]);

  if (songResponse.error) throw new Response("Song not found", { status: 404 });

  if (!artistsResponse.data || artistsResponse.error)
    throw new Response("No artists data", { status: 500 });

  const session = await getSession(request.headers.get("Cookie"));
  const user = session.get("user");
  const userId = user?.id;

  if (songResponse.data.userId !== userId) {
    throw new Response("Song not found", { status: 404 });
  }

  return {
    song: songResponse.data,
    artists: artistsResponse.data,
    uploadcarePublicKey: process.env.VITE_UPLOADCARE_PUBLIC_KEY ?? "",
  };
}

export async function action({ request }: Route.ClientActionArgs) {
  const formData = await request.formData();
  const submission = parseWithZod(formData, { schema: UpdateSongSchema });

  if (submission.status !== "success") return submission.reply();

  // TODO: update artists
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { artistIds, ...body } = submission.value;

  const session = await getSession(request.headers.get("Cookie"));
  const token = session.get("token");
  const user = session.get("user");
  const userId = user?.id;
  if (!token || !userId) return redirect("/login");

  const $fetch = createAuthFetch(token);
  const payload = { ...body, userId };

  const { data, error } = await $fetch<ActionSuccessResponse>(
    `/songs/${submission.value.id}`,
    {
      method: "PATCH",
      body: payload,
    },
  );

  if (!data || error) {
    return submission.reply({
      fieldErrors: { title: ["Failed to update song."] },
    });
  }

  return redirect(href("/songs/:slug", { slug: data.song.slug }));
}

export default function SongSlugEdit({
  loaderData,
  actionData,
}: Route.ComponentProps) {
  const { song, artists, uploadcarePublicKey } = loaderData;
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  const [form, fields] = useForm({
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: UpdateSongSchema });
    },
    lastResult: actionData,
    shouldValidate: "onBlur",
    shouldRevalidate: "onBlur",
    defaultValue: {
      id: song.id,
      imageUrl: song.imageUrl ?? "",
      title: song.title,
      artistIds: song.artists?.map((artist) => artist.id) ?? [],
    },
  });

  // const [imageUrl, setImageUrl] = useState(fields.imageUrl.initialValue ?? "");

  const defaultOptions: Option[] = artists.map((artist) => ({
    value: artist.id,
    label: artist.name,
  }));

  const controlArtistIds = useInputControl(fields.artistIds); // Conform
  const controlimageUrl = useInputControl(fields.imageUrl); // Conform
  const [artistOptions, setArtistOptions] = useState<Option[]>(
    defaultOptions.filter((opt) =>
      song.artists?.some((artists) => artists.id === opt.value),
    ),
  ); // Multiselect

  const handleChangeArtistOptions = (options: Option[]) => {
    setArtistOptions(options); // [{value: "abc", label: "Artist"}]
    const artistIds = options.map((option) => option.value); // ["abc", "def"]

    controlArtistIds.change(artistIds);
  };

  return (
    <div className="my-8">
      <Form method="post" {...getFormProps(form)} className="mr-4 ml-4">
        <input {...getInputProps(fields.id, { type: "hidden" })} />
        <label
          className="mb-10 flex cursor-pointer flex-col items-center"
          htmlFor={fields.imageUrl.id}
        >
          <SingleFileUploader
            value={controlimageUrl.value}
            onChange={controlimageUrl.change}
            publicKey={uploadcarePublicKey}
          />

          <input
            {...getInputProps(fields.imageUrl, { type: "text" })}
            className="hidden"
          />
        </label>
        <p className="text-sm text-red-500">{fields.imageUrl.errors}</p>

        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-1">
            <Input
              {...getInputProps(fields.title, { type: "text" })}
              placeholder="Title"
              className="border-zinc-700 bg-zinc-800"
            />
            <p className="text-sm text-red-500">{fields.title.errors}</p>
          </div>

          <div className="flex flex-col gap-1">
            <MultiselectArtists
              defaultOptions={defaultOptions}
              artistOptions={artistOptions}
              handleChangeArtistOptions={handleChangeArtistOptions}
              id="artist"
              placeholder="Type artist name..."
              className="border-zinc-700 bg-zinc-800"
            />
            <p className="text-sm text-red-500">{fields.artistIds.errors}</p>
          </div>
        </div>

        <div className="mt-14">
          <Button className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Save"}
          </Button>
        </div>
      </Form>
    </div>
  );
}
