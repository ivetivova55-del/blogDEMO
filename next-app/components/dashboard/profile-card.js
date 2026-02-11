"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ProfileCard({ name, email, onProfileUpdated }) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState(name || "");
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSaving(true);
    setError("");

    try {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: displayName }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to update profile.");
      }

      onProfileUpdated?.(data.user);
      setIsEditing(false);
      router.refresh();
    } catch (saveError) {
      setError(saveError.message || "Unable to update profile.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader className="flex items-start justify-between gap-3 sm:flex-row">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ink/40">
            Profile
          </p>
          <CardTitle className="text-2xl">Account details</CardTitle>
        </div>
        <UserRound className="h-6 w-6 text-ink/40" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <Label>Email</Label>
            <p className="mt-2 text-sm text-ink/70">{email}</p>
          </div>
          {isEditing ? (
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="name">Display name</Label>
                <Input
                  id="name"
                  value={displayName}
                  onChange={(event) => setDisplayName(event.target.value)}
                  required
                />
              </div>
              {error ? (
                <p className="rounded-2xl bg-red-50 px-4 py-2 text-sm text-red-600">
                  {error}
                </p>
              ) : null}
              <div className="flex flex-wrap gap-2">
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? "Saving..." : "Save changes"}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setIsEditing(false);
                    setDisplayName(name || "");
                    setError("");
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          ) : (
            <div className="flex items-center justify-between gap-3">
              <div>
                <Label>Name</Label>
                <p className="mt-2 text-sm text-ink/70">
                  {displayName || "Add a display name"}
                </p>
              </div>
              <Button variant="secondary" onClick={() => setIsEditing(true)}>
                Edit
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
