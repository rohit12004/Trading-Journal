import { useMutation } from "@tanstack/react-query";
import client from "../api/client";

/**
 * Hook to refine raw trading notes into structured markdown.
 */
export const useRefineNotesMutation = () => {
  return useMutation({
    mutationFn: async (notes) => {
      const { data } = await client.post("/ai/refine-notes", { notes });
      return data;
    },
  });
};

/**
 * Hook to upload voice log audio file and get structured trade parameters.
 */
export const useVoiceLogMutation = () => {
  return useMutation({
    mutationFn: async (audioBlob) => {
      const formData = new FormData();
      formData.append("file", audioBlob, "voice-log.webm");
      const { data } = await client.post("/ai/voice-log", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return data;
    },
  });
};

/**
 * Hook to chat with the AI Coach.
 */
export const useAICoachChatMutation = () => {
  return useMutation({
    mutationFn: async (message) => {
      const { data } = await client.post("/ai/coach/chat", { message });
      return data;
    },
  });
};
