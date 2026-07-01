import React, { useState, useRef, useEffect } from "react";
import { Bot, Send, Mic, Square, Loader2, Save, Calendar, Brain, AlertTriangle, CheckCircle, Trash2 } from "lucide-react";
import {
  useGetJournalQuery,
  useSaveJournalMutation,
  useVoiceJournalMutation,
  useAICoachChatMutation,
  useRefineNotesMutation,
  useVoiceTranscribeMutation,
  useVoiceCoachChatMutation,
} from "../hooks/useAIQuery";
import { toast } from "sonner";

const AICoach = () => {
  // --- Journal State ---
  const [selectedDate, setSelectedDate] = useState(new Date().toLocaleDateString("sv-SE"));
  const [journalContent, setJournalContent] = useState("");
  
  // Voice Recording States for Journal
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [audioChunks, setAudioChunks] = useState([]);
  const durationTimerRef = useRef(null);

  // Extracted entities metadata (from Neo4j response)
  const [extractedMetadata, setExtractedMetadata] = useState(null);

  // Queries & Mutations
  const { data: existingJournal, isLoading: isLoadingJournal, refetch: refetchJournal } = useGetJournalQuery(selectedDate);
  const saveJournalMutation = useSaveJournalMutation();
  const voiceJournalMutation = useVoiceJournalMutation();
  const coachChatMutation = useAICoachChatMutation();
  const refineMutation = useRefineNotesMutation();
  const voiceTranscribeMutation = useVoiceTranscribeMutation();
  const voiceCoachChatMutation = useVoiceCoachChatMutation();

  const lastLoadedDateRef = useRef(null);

  // Voice Recording States for Chat
  const [isChatRecording, setIsChatRecording] = useState(false);
  const [chatRecordingDuration, setChatRecordingDuration] = useState(0);
  const [chatMediaRecorder, setChatMediaRecorder] = useState(null);
  const [chatAudioChunks, setChatAudioChunks] = useState([]);
  const chatDurationTimerRef = useRef(null);

  // Handle duration timer for chat recording
  useEffect(() => {
    if (isChatRecording) {
      chatDurationTimerRef.current = setInterval(() => {
        setChatRecordingDuration((prev) => prev + 1);
      }, 1000);
    } else {
      if (chatDurationTimerRef.current) {
        clearInterval(chatDurationTimerRef.current);
        chatDurationTimerRef.current = null;
      }
    }
    return () => {
      if (chatDurationTimerRef.current) clearInterval(chatDurationTimerRef.current);
    };
  }, [isChatRecording]);

  const startChatRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const options = { mimeType: "audio/webm" };
      let recorder;
      try {
        recorder = new MediaRecorder(stream, options);
      } catch (e) {
        recorder = new MediaRecorder(stream);
      }

      const chunks = [];
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(chunks, { type: recorder.mimeType || "audio/webm" });
        await processChatVoice(audioBlob);
      };

      setChatAudioChunks(chunks);
      setChatMediaRecorder(recorder);
      setChatRecordingDuration(0);
      setIsChatRecording(true);
      recorder.start();
      toast.info("Recording voice question...");
    } catch (err) {
      console.error("Microphone access failed:", err);
      toast.error("Failed to access microphone.");
    }
  };

  const stopChatRecording = () => {
    if (chatMediaRecorder && chatMediaRecorder.state !== "inactive") {
      chatMediaRecorder.stop();
      chatMediaRecorder.stream.getTracks().forEach((track) => track.stop());
      setIsChatRecording(false);
    }
  };

  const processChatVoice = async (audioBlob) => {
    try {
      toast.info("Sending voice question to AI Coach...");
      const result = await voiceCoachChatMutation.mutateAsync(audioBlob);
      if (result && result.transcript && result.response) {
        setChatMessages((prev) => [
          ...prev,
          {
            sender: "user",
            text: result.transcript,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
          {
            sender: "coach",
            text: result.response,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          }
        ]);
        toast.success("Voice chat processed!");
      }
    } catch (err) {
      console.error("Error in AI Coach Voice Chat:", err);
      toast.error("AI Coach voice query failed.");
    }
  };

  const handleRefineJournal = async () => {
    if (!journalContent || !journalContent.trim()) return;
    try {
      const response = await refineMutation.mutateAsync(journalContent);
      if (response && response.refined_notes) {
        setJournalContent(response.refined_notes);
        toast.success("Journal notes refined with AI!");
      }
    } catch (err) {
      console.error("Failed to refine journal:", err);
      toast.error("Failed to refine notes.");
    }
  };

  // --- Chat State ---
  const [chatMessages, setChatMessages] = useState([
    {
      sender: "coach",
      text: "Hello! I am QuantCoach AI, your trading psychology mentor. Tell me about your trading mindset, or log your journal entry and ask me to analyze your performance.",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [currentMessage, setCurrentMessage] = useState("");
  const chatEndRef = useRef(null);

  // Sync journal content when fetching is complete (only if selectedDate changed to prevent overwrite on save refetch)
  useEffect(() => {
    if (existingJournal && lastLoadedDateRef.current !== selectedDate) {
      setJournalContent(existingJournal.content);
      lastLoadedDateRef.current = selectedDate;
    } else if (!existingJournal && lastLoadedDateRef.current !== selectedDate) {
      setJournalContent("");
      lastLoadedDateRef.current = selectedDate;
    }
    setExtractedMetadata(null);
  }, [existingJournal, selectedDate]);

  // Scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, coachChatMutation.isPending]);

  // Handle duration timer for recording
  useEffect(() => {
    if (isRecording) {
      durationTimerRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } else {
      if (durationTimerRef.current) {
        clearInterval(durationTimerRef.current);
        durationTimerRef.current = null;
      }
    }
    return () => {
      if (durationTimerRef.current) clearInterval(durationTimerRef.current);
    };
  }, [isRecording]);

  // --- Voice Recording Functions ---
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const options = { mimeType: "audio/webm" };
      let recorder;
      try {
        recorder = new MediaRecorder(stream, options);
      } catch (e) {
        recorder = new MediaRecorder(stream);
      }

      const chunks = [];
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(chunks, { type: recorder.mimeType || "audio/webm" });
        await processVoiceJournal(audioBlob);
      };

      setAudioChunks(chunks);
      setMediaRecorder(recorder);
      setRecordingDuration(0);
      setIsRecording(true);
      recorder.start();
      toast.info("Microphone is recording...");
    } catch (err) {
      console.error("Microphone access failed:", err);
      toast.error("Failed to access microphone. Please check permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== "inactive") {
      mediaRecorder.stop();
      mediaRecorder.stream.getTracks().forEach((track) => track.stop());
      setIsRecording(false);
    }
  };

  const processVoiceJournal = async (audioBlob) => {
    try {
      toast.info("Processing voice journal entry with Gemini...");
      const result = await voiceJournalMutation.mutateAsync(audioBlob);
      
      if (result && result.transcript) {
        setJournalContent((prev) => (prev ? prev + "\n" + result.transcript : result.transcript));
        toast.success("Voice journal transcribed successfully!");
        
        if (result.date) {
          setSelectedDate(result.date);
          toast.info(`Journal date set to: ${result.date}`);
        }
      } else {
        toast.error("Failed to transcribe journal entry.");
      }
    } catch (err) {
      console.error("Error processing voice journal:", err);
      toast.error("Failed to process voice journal. Please try again.");
    }
  };

  const formatDuration = (sec) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // --- Save Journal Handler ---
  const handleSaveJournal = async () => {
    if (!journalContent.trim()) {
      toast.error("Journal content cannot be empty.");
      return;
    }
    
    try {
      const response = await saveJournalMutation.mutateAsync({
        date: selectedDate,
        content: journalContent,
      });

      if (response && response.status === "success") {
        toast.success("Daily journal entry saved and indexed in Neo4j!");
        refetchJournal();
        setJournalContent(""); // Clear the fields after logging
        
        if (response.extracted_entities) {
          setExtractedMetadata(response.extracted_entities);
        }
      }
    } catch (err) {
      console.error("Failed to save journal:", err);
      toast.error(err.response?.data?.detail || "Failed to save journal entry.");
    }
  };

  // --- Chat Submit Handler ---
  const handleSendChatMessage = async (e) => {
    e.preventDefault();
    if (!currentMessage.trim()) return;

    const userMsgText = currentMessage;
    setCurrentMessage("");

    setChatMessages((prev) => [
      ...prev,
      {
        sender: "user",
        text: userMsgText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);

    try {
      const response = await coachChatMutation.mutateAsync(userMsgText);
      
      setChatMessages((prev) => [
        ...prev,
        {
          sender: "coach",
          text: response.response || "I couldn't formulate advice right now.",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } catch (err) {
      console.error("Error in AI Coach Chat:", err);
      toast.error("AI Coach failed to reply. Please check connection.");
      
      setChatMessages((prev) => [
        ...prev,
        {
          sender: "coach",
          text: "I encountered an error trying to connect to my knowledge base. Please check that Neo4j is running correctly.",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full max-w-7xl mx-auto h-full min-h-0">
      
      {/* ── LEFT COLUMN: MINDSET JOURNALING ─────────────────────────────────── */}
      <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-5 flex flex-col shadow-sm h-full min-h-0">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5 border-b border-slate-100 pb-2.5 flex-shrink-0">
          <Brain className="w-4.5 h-4.5 text-violet-650" />
          Daily Mindset Journal
        </h3>

        {/* Date Selector & Loading */}
        <div className="flex gap-2 items-center my-3.5 flex-shrink-0">
          <Calendar className="w-4 h-4 text-slate-400" />
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 outline-none text-slate-800 focus:border-violet-500 font-bold"
          />
          {isLoadingJournal && <Loader2 className="w-4.5 h-4.5 animate-spin text-slate-400" />}
        </div>

        {/* Voice Recorder Panel */}
        <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-3 mb-3.5 flex-shrink-0 flex items-center justify-between">
          <div className="flex flex-col text-left">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Voice Journaling</span>
            <span className="text-xs text-slate-800 mt-0.5">
              {isRecording ? `Recording... (${formatDuration(recordingDuration)})` : "Record thoughts with audio"}
            </span>
          </div>

          <div className="flex gap-1.5">
            {isRecording ? (
              <button
                onClick={stopRecording}
                className="w-8 h-8 rounded-lg bg-red-500 hover:bg-red-650 flex items-center justify-center text-white transition-colors"
                title="Stop Recording"
              >
                <Square className="w-3.5 h-3.5 fill-white" />
              </button>
            ) : (
              <button
                onClick={startRecording}
                disabled={voiceJournalMutation.isPending}
                className="w-8 h-8 rounded-lg bg-violet-600 hover:bg-violet-750 flex items-center justify-center text-white transition-colors disabled:opacity-50"
                title="Start Recording"
              >
                <Mic className="w-4.5 h-4.5" />
              </button>
            )}
          </div>
        </div>

        {voiceJournalMutation.isPending && (
          <div className="flex items-center gap-1.5 text-[11px] text-violet-650 font-bold justify-center py-1 flex-shrink-0">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-violet-600" />
            <span>Gemini is transcribing voice journal...</span>
          </div>
        )}

        {/* Journal Textarea */}
        <div className="flex-1 flex flex-col min-h-0 space-y-1">
          <div className="flex justify-between items-center flex-shrink-0">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Mindset Entry</label>
            {journalContent && journalContent.trim() && (
              <button
                type="button"
                onClick={handleRefineJournal}
                disabled={refineMutation.isPending}
                className="text-[10px] text-violet-600 hover:text-violet-750 font-bold flex items-center gap-0.5 transition-colors disabled:opacity-50"
              >
                {refineMutation.isPending ? (
                  <>
                    <span className="animate-spin inline-block w-2.5 h-2.5 border-t-2 border-violet-600 rounded-full" style={{ borderRightColor: 'transparent' }}></span>
                    Refining...
                  </>
                ) : (
                  <>✨ Refine with AI</>
                )}
              </button>
            )}
          </div>
          <textarea
            value={journalContent}
            onChange={(e) => setJournalContent(e.target.value)}
            placeholder="Log your mindset: What trades did you take? Did you feel greedy or disciplined? Did you follow your rules? Write about emotions or strategies..."
            className="flex-1 w-full bg-slate-50/50 border border-slate-200 focus:border-violet-500 focus:ring-1 focus:ring-violet-500/20 rounded-xl p-3 text-xs text-black outline-none resize-none placeholder-slate-400 shadow-sm leading-relaxed"
          />
        </div>

        {/* Save & Extracted Graph Tags */}
        <div className="mt-3.5 flex-shrink-0 flex flex-col gap-3">
          {/* Metadata/Tags extracted from Graph Model */}
          {extractedMetadata && (
            <div className="p-3 bg-violet-50/50 border border-violet-100 rounded-xl text-left text-[11px]">
              <div className="font-bold text-violet-850 flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                Graph Mindset Synced:
              </div>
              <p className="text-slate-650 mt-1 italic font-semibold">"{extractedMetadata.summary}"</p>
              
              <div className="flex flex-wrap gap-1 mt-2.5">
                {extractedMetadata.emotions?.map((e) => (
                  <span key={e} className="px-1.5 py-0.5 rounded bg-violet-100 text-violet-850 font-bold text-[9px] uppercase tracking-wide">
                    🎭 {e}
                  </span>
                ))}
                {extractedMetadata.strategies?.map((s) => (
                  <span key={s} className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 font-bold text-[9px] uppercase tracking-wide">
                    📈 {s}
                  </span>
                ))}
                {extractedMetadata.mistakes?.map((m) => (
                  <span key={m} className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-bold text-[9px] uppercase tracking-wide">
                    ⚠️ {m}
                  </span>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={handleSaveJournal}
            disabled={saveJournalMutation.isPending}
            className="w-full py-2.5 bg-black hover:bg-neutral-850 text-white text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50"
          >
            {saveJournalMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Syncing to Graph...
              </>
            ) : (
              <>
                <Save className="w-4.5 h-4.5" />
                Save & Index Mindset Entry
              </>
            )}
          </button>
        </div>

      </div>

      {/* ── RIGHT COLUMN: AI COACH CHAT ────────────────────────────────────── */}
      <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-5 flex flex-col shadow-sm h-full min-h-0">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5 border-b border-slate-100 pb-2.5 flex-shrink-0">
          <Bot className="w-4.5 h-4.5 text-violet-600" />
          Ask QuantCoach AI
          <span className="text-[10px] bg-violet-100 text-violet-750 px-1.5 py-0.5 rounded-full font-bold">Memory-Aware</span>
        </h3>

        {/* Chat Feed */}
        <div className="flex-1 min-h-0 overflow-y-auto py-4 space-y-4 pr-1 scroll-smooth light-scroll">
          {chatMessages.map((msg, index) => (
            <div
              key={index}
              className={`flex flex-col max-w-[85%] ${
                msg.sender === "user" ? "ml-auto items-end" : "mr-auto items-start"
              }`}
            >
              <div className="flex items-center gap-1 mb-1">
                {msg.sender === "coach" && <Bot className="w-3.5 h-3.5 text-violet-600" />}
                <span className="text-[9px] font-bold text-slate-400 tracking-wide uppercase">
                  {msg.sender === "coach" ? "QuantCoach" : "You"} • {msg.timestamp}
                </span>
              </div>
              <div
                className={`p-3 rounded-2xl text-xs text-left leading-relaxed shadow-inner ${
                  msg.sender === "user"
                    ? "bg-violet-600 text-white font-medium rounded-tr-none"
                    : "bg-slate-50 border border-slate-100 text-slate-800 rounded-tl-none"
                }`}
                style={{ whiteSpace: "pre-line" }}
              >
                {msg.text}
              </div>
            </div>
          ))}

          {/* Typing/Loading State */}
          {coachChatMutation.isPending && (
            <div className="flex flex-col max-w-[80%] mr-auto text-left items-start animate-pulse">
              <div className="flex items-center gap-1 mb-1">
                <Bot className="w-3.5 h-3.5 text-violet-650" />
                <span className="text-[9px] font-bold text-slate-400 uppercase">QuantCoach • Typing...</span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 rounded-tl-none flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-violet-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                <span className="w-1.5 h-1.5 bg-violet-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                <span className="w-1.5 h-1.5 bg-violet-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
              </div>
            </div>
          )}
          
          <div ref={chatEndRef} />
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSendChatMessage} className="border-t border-slate-100 pt-3.5 flex flex-col gap-2 flex-shrink-0">
          {(voiceTranscribeMutation.isPending || voiceCoachChatMutation.isPending) && (
            <div className="flex items-center gap-1.5 text-[10px] text-violet-650 font-bold justify-center">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-violet-600" />
              <span>Processing voice chat request...</span>
            </div>
          )}
          <div className="flex gap-2 w-full items-center">
            {isChatRecording ? (
              <button
                type="button"
                onClick={stopChatRecording}
                className="w-10 h-10 rounded-xl bg-red-500 hover:bg-red-650 text-white flex items-center justify-center shadow-sm flex-shrink-0 transition-colors animate-pulse"
                title={`Stop Recording (${formatDuration(chatRecordingDuration)})`}
              >
                <Square className="w-4 h-4 fill-white" />
              </button>
            ) : (
              <button
                type="button"
                onClick={startChatRecording}
                disabled={voiceTranscribeMutation.isPending || coachChatMutation.isPending}
                className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center shadow-sm flex-shrink-0 transition-colors disabled:opacity-50"
                title="Record Question"
              >
                <Mic className="w-4.5 h-4.5" />
              </button>
            )}

            <input
              type="text"
              value={currentMessage}
              onChange={(e) => setCurrentMessage(e.target.value)}
              placeholder={isChatRecording ? `Recording voice... (${formatDuration(chatRecordingDuration)})` : "Ask coach: 'Why did I get anxious recently?'"}
              disabled={isChatRecording}
              className="flex-1 bg-slate-50 border border-slate-200 focus:border-violet-500 rounded-xl px-4 py-2.5 text-xs text-black outline-none placeholder-slate-400 shadow-sm disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={!currentMessage.trim() || coachChatMutation.isPending || isChatRecording}
              className="w-10 h-10 rounded-xl bg-black hover:bg-neutral-850 text-white flex items-center justify-center shadow-sm transition-colors disabled:opacity-40"
            >
              <Send className="w-4 h-4 fill-white" />
            </button>
          </div>
        </form>
      </div>

    </div>
  );
};

export default AICoach;
