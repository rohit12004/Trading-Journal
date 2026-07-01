import { useMutation, useQuery } from "@tanstack/react-query";
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
      
      const clientDate = new Date().toLocaleDateString("sv-SE");
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      
      const { data } = await client.post(`/ai/voice-log?client_date=${clientDate}&timezone=${timezone}`, formData, {
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

/**
 * Hook to fetch a daily journal entry by date.
 */
export const useGetJournalQuery = (date) => {
  return useQuery({
    queryKey: ["journal", date],
    queryFn: async () => {
      const { data } = await client.get(`/journal?date=${date}`);
      return data;
    },
    enabled: !!date,
  });
};

/**
 * Hook to create or update a daily journal entry.
 */
export const useSaveJournalMutation = () => {
  return useMutation({
    mutationFn: async ({ date, content }) => {
      const { data } = await client.post("/journal", { date, content });
      return data;
    },
  });
};

/**
 * Hook to process voice journal audio file.
 */
export const useVoiceJournalMutation = () => {
  return useMutation({
    mutationFn: async (audioBlob) => {
      const formData = new FormData();
      formData.append("file", audioBlob, "voice-journal.webm");
      
      const clientDate = new Date().toLocaleDateString("sv-SE");
      
      const { data } = await client.post(`/journal/voice?client_date=${clientDate}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return data;
    },
  });
};

/**
 * Hook to transcribe plain voice question for chatbot.
 */
export const useVoiceTranscribeMutation = () => {
  return useMutation({
    mutationFn: async (audioBlob) => {
      const formData = new FormData();
      formData.append("file", audioBlob, "chat-voice.webm");
      
      const { data } = await client.post("/ai/voice-transcribe", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return data;
    },
  });
};

/**
 * Hook to directly send voice chat question and get AI Coach response in one pass.
 */
export const useVoiceCoachChatMutation = () => {
  return useMutation({
    mutationFn: async (audioBlob) => {
      const formData = new FormData();
      formData.append("file", audioBlob, "coach-voice-chat.webm");
      
      const { data } = await client.post("/ai/coach/voice-chat", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return data;
    },
  });
};
