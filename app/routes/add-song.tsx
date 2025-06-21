import {
  getFormProps,
  getInputProps,
  useForm,
  useInputControl,
} from "@conform-to/react";
import { parseWithZod } from "@conform-to/zod";
import { useState } from "react";
import { Form, href, redirect, useNavigation } from "react-router";

import { MultiselectArtists } from "~/components/multiselect-artists";
import { SingleFileUploader } from "~/components/single-uploadcare";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import type { Option } from "~/components/ui/multiselect";
import { createAuthFetch } from "~/lib/fetch";
import type { paths } from "~/schema";
import { CreateSongSchema } from "~/schemas/song";
import { getSession } from "~/sessions.server";
import type { Route } from "./+types/add-song";
import { type ZodError } from "zod";
import { Alert, AlertTitle } from "~/components/ui/alert";
import { AlertCircleIcon } from "lucide-react";

type LoaderSuccessResponse =
  paths["/artists"]["get"]["responses"][200]["content"]["application/json"];

type ActionSuccessResponse =
  paths["/songs"]["post"]["responses"][200]["content"]["application/json"];

type ActionErrorResponse = {
  error?: ZodError | string;
};

export function meta({}: Route.MetaArgs) {
  return [{ title: "Add New Song to Lyrifix" }];
}

export async function loader({ request }: Route.LoaderArgs) {
  const session = await getSession(request.headers.get("Cookie"));
  const token = session.get("token");
  if (!token) return redirect("/login");

  const $fetch = createAuthFetch(token);

  const { data: artists, error } =
    await $fetch<LoaderSuccessResponse>("/artists");

  if (!artists || error) throw new Response("No artists data", { status: 500 });

  return {
    artists,
    uploadcarePublicKey: process.env.VITE_UPLOADCARE_PUBLIC_KEY ?? "",
  };
}

export async function action({ request }: Route.ClientActionArgs) {
  const formData = await request.formData();

  const submission = parseWithZod(formData, { schema: CreateSongSchema });
  if (submission.status !== "success") return submission.reply();

  const session = await getSession(request.headers.get("Cookie"));
  const token = session.get("token");
  const user = session.get("user");
  const userId = user?.id;
  if (!token || !userId) return redirect("/login");

  const $fetch = createAuthFetch(token);
  const payload = { ...submission.value, userId };

  const { data: song, error } = await $fetch<
    ActionSuccessResponse,
    ActionErrorResponse
  >("/songs", {
    method: "POST",
    body: payload,
  });

  if (!song || error) {
    const errorMessage =
      typeof error.error === "string" ? error.error : "Failed to add song.";

    return submission.reply({
      formErrors: [errorMessage],
    });
  }

  return redirect(href("/songs/:slug", { slug: song.slug }));
}

export default function AddSongRoute({
  actionData,
  loaderData,
}: Route.ComponentProps) {
  const { artists, uploadcarePublicKey } = loaderData;
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  const [form, fields] = useForm({
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: CreateSongSchema });
    },
    lastResult: actionData,
    shouldValidate: "onBlur",
    shouldRevalidate: "onBlur",
    defaultValue: {
      imageUrl: "",
      title: "",
      artistIds: [], // ["abc", "def"],
    },
  });

  const [imageUrl, setImageUrl] = useState(fields.imageUrl.initialValue ?? "");

  const artistIdsFieldList = fields.artistIds.getFieldList();

  const defaultOptions: Option[] = artists.map((artist) => ({
    value: artist.id,
    label: artist.name,
  }));

  const controlArtistIds = useInputControl(fields.artistIds); // Conform
  const [artistOptions, setArtistOptions] = useState<Option[]>([]); // Multiselect

  const handleChangeArtistOptions = (options: Option[]) => {
    setArtistOptions(options); // [{value: "abc", label: "Artist"}]
    const artistIds = options.map((option) => option.value); // ["abc", "def"]
    controlArtistIds.change(artistIds);
  };

  return (
    <div className="flex flex-col items-center pt-10">
      <Card className="w-xs">
        <CardHeader>
          <CardTitle className="text-center font-bold">Add New Song</CardTitle>
        </CardHeader>

        <CardContent>
          <Form
            method="post"
            {...getFormProps(form)}
            className="mr-4 ml-4 space-y-4"
          >
            {form.errors && (
              <Alert variant="destructive">
                <AlertCircleIcon />
                <AlertTitle>{form.errors}</AlertTitle>
              </Alert>
            )}

            <div className="flex flex-col gap-1">
              <Label htmlFor={fields.title.id}>Song Title *</Label>
              <Input
                {...getInputProps(fields.title, { type: "text" })}
                placeholder="Song Title"
                className="border-zinc-700 bg-zinc-800"
              />
              <p className="text-sm text-red-500">{fields.title.errors}</p>
            </div>

            <div className="flex flex-col gap-1">
              <Label htmlFor={fields.artistIds.id}>Select Artists *</Label>

              <MultiselectArtists
                defaultOptions={defaultOptions}
                artistOptions={artistOptions}
                handleChangeArtistOptions={handleChangeArtistOptions}
                id="artist"
                placeholder="Type artist name..."
                className="border-zinc-700 bg-zinc-800"
              />
              <p className="text-sm text-red-500">{fields.artistIds.errors}</p>

              <ul>
                {artistIdsFieldList.map((artistId) => (
                  <li key={artistId.key}>
                    <input name={artistId.name} />
                    <div>{artistId.errors}</div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex flex-col gap-1">
              <Label htmlFor={fields.spotifyUrl.id}>Spotify URL</Label>
              <Input
                {...getInputProps(fields.spotifyUrl, { type: "text" })}
                placeholder="Spotify URL"
                className="border-zinc-700 bg-zinc-800"
              />
              <p className="text-sm text-red-500">{fields.spotifyUrl.errors}</p>
            </div>

            <div className="flex cursor-pointer flex-col items-center">
              <label htmlFor={fields.imageUrl.id}>
                <SingleFileUploader
                  value={imageUrl}
                  onChange={setImageUrl}
                  publicKey={uploadcarePublicKey}
                />

                <input
                  {...getInputProps(fields.imageUrl, { type: "text" })}
                  value={imageUrl}
                  readOnly
                  className="hidden"
                />
              </label>
              <p className="text-sm text-red-500">{fields.imageUrl.errors}</p>
            </div>

            <div>
              <Button className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "Saving Song..." : "Save Song"}
              </Button>
            </div>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
