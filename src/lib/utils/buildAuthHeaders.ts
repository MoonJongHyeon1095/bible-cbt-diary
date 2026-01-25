"use client";

export type AuthHeaders = {
  Authorization: string;
};

export const buildAuthHeaders = (accessToken: string): AuthHeaders => ({
  Authorization: `Bearer ${accessToken}`,
});
