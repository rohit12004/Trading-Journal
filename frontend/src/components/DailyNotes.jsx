import React, { useState, useEffect } from "react";
import {
  FileText,
  Plus,
  Trash2,
  Pin,
  Search,
  Calendar,
  Edit3,
  Check,
  X,
  BookOpen
} from "lucide-react";
import { toast } from "sonner";

const CATEGORIES = [
  "Trading Rule",
  "Market Observation",
  "Psychology",
  "Strategy",
  "General Note",
];

const INITIAL_NOTES = [
  {
    id: "sample-1",
    title: "Risk Management & Stop Loss Discipline",
    category: "Trading Rule",
    date: new Date().toISOString().split("T")[0],
    pinned: true,
    content: "1. Never risk more than 1.5% of total capital on a single option trade.\n2. Always place system Stop Loss immediately after execution.\n3. Zero revenge trading after 2 consecutive stop-losses.",
  },
  {
    id: "sample-2",
    title: "BankNifty Expiry VWAP Reversal Pattern",
    category: "Strategy",
    date: new Date().toISOString().split("T")[0],
    pinned: false,
    content: "Observed strong institutional buying around 1:30 PM whenever BankNifty tests the daily VWAP level during weekly expiry sessions. Wait for a 5-min bullish engulfing confirmation candle before entering CE.",
  },
];

const DailyNotes = () => {
  const [notes, setNotes] = useState(() => {
    try {
      const saved = localStorage.getItem("quantcoach_daily_notes_v1");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error("Error loading notes from localStorage:", e);
    }
    return INITIAL_NOTES;
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState("ALL");
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Form State
  const [formState, setFormState] = useState({
    title: "",
    category: "Trading Rule",
    date: new Date().toISOString().split("T")[0],
    pinned: false,
    content: "",
  });

  // Save to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem("quantcoach_daily_notes_v1", JSON.stringify(notes));
    } catch (e) {
      console.error("Error saving notes to localStorage:", e);
    }
  }, [notes]);

  const handleOpenCreateForm = () => {
    setEditingId(null);
    setFormState({
      title: "",
      category: "Trading Rule",
      date: new Date().toISOString().split("T")[0],
      pinned: false,
      content: "",
    });
    setIsCreating(true);
  };

  const handleEditNote = (note) => {
    setEditingId(note.id);
    setFormState({
      title: note.title || "",
      category: note.category || "General Note",
      date: note.date || new Date().toISOString().split("T")[0],
      pinned: note.pinned || false,
      content: note.content || "",
    });
    setIsCreating(true);
  };

  const handleSaveNote = (e) => {
    e.preventDefault();
    if (!formState.title.trim()) {
      toast.error("Please enter a note title.");
      return;
    }

    if (editingId) {
      setNotes((prev) =>
        prev.map((n) =>
          n.id === editingId
            ? { ...n, ...formState, title: formState.title.trim(), content: formState.content.trim() }
            : n
        )
      );
      toast.success("Note updated successfully!");
    } else {
      const newNote = {
        id: `note-${Date.now()}`,
        ...formState,
        title: formState.title.trim(),
        content: formState.content.trim(),
      };
      setNotes((prev) => [newNote, ...prev]);
      toast.success("New daily note created!");
    }

    setIsCreating(false);
    setEditingId(null);
  };

  const handleDeleteNote = (id) => {
    if (window.confirm("Are you sure you want to delete this note?")) {
      setNotes((prev) => prev.filter((n) => n.id !== id));
      toast.success("Note deleted.");
    }
  };

  const handleTogglePin = (id) => {
    setNotes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, pinned: !n.pinned } : n))
    );
  };

  // Safe Filter & Search Logic
  const safeNotes = Array.isArray(notes) ? notes : INITIAL_NOTES;

  const filteredNotes = safeNotes.filter((note) => {
    if (!note) return false;
    const matchesCategory =
      selectedCategoryFilter === "ALL" || note.category === selectedCategoryFilter;
    const q = (searchQuery || "").toLowerCase();
    const titleStr = (note.title || "").toLowerCase();
    const contentStr = (note.content || "").toLowerCase();
    const catStr = (note.category || "").toLowerCase();
    const matchesSearch =
      titleStr.includes(q) || contentStr.includes(q) || catStr.includes(q);

    return matchesCategory && matchesSearch;
  });

  // Sort: Pinned notes first, then by date/id descending
  const sortedNotes = [...filteredNotes].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return new Date(b.date || 0) - new Date(a.date || 0);
  });

  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 light-scroll text-left">
      {/* Top Header */}
      <div className="pb-4 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Daily Notes &amp; Journal</h1>
            <span className="bg-amber-100 text-amber-800 font-extrabold text-[10px] px-2 py-0.5 rounded-full">
              {safeNotes.length} saved
            </span>
          </div>
          <p className="text-slate-500 text-xs mt-0.5">
            Capture important market observations, daily trading rules, strategies, and psychological learnings.
          </p>
        </div>

        {!isCreating && (
          <button
            onClick={handleOpenCreateForm}
            className="px-4 py-2 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-2 self-start sm:self-center"
          >
            <Plus className="w-4 h-4 text-amber-400" />
            Create Daily Note
          </button>
        )}
      </div>

      {/* Note Creation / Editing Modal Form */}
      {isCreating && (
        <form
          onSubmit={handleSaveNote}
          className="bg-white border-2 border-amber-200 rounded-2xl p-6 shadow-md space-y-4 animate-fade-in"
        >
          <div className="flex justify-between items-center pb-3 border-b border-slate-100">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 uppercase tracking-wider">
              <FileText className="w-4 h-4 text-amber-500" />
              {editingId ? "Edit Daily Note" : "New Daily Note Entry"}
            </h2>
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              className="text-slate-400 hover:text-slate-700 p-1 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Note Title */}
            <div className="md:col-span-2 flex flex-col space-y-1">
              <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">
                Note Title *
              </label>
              <input
                type="text"
                value={formState.title}
                onChange={(e) => setFormState({ ...formState, title: e.target.value })}
                placeholder="e.g. Nifty Opening Range Breakout Rules..."
                className="bg-slate-50 border border-slate-200 focus:border-amber-400 focus:bg-white rounded-xl px-3 py-2 text-xs text-slate-900 outline-none shadow-sm font-semibold"
                required
              />
            </div>

            {/* Category Select */}
            <div className="flex flex-col space-y-1">
              <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">
                Category / Tag
              </label>
              <select
                value={formState.category}
                onChange={(e) => setFormState({ ...formState, category: e.target.value })}
                className="bg-slate-50 border border-slate-200 focus:border-amber-400 focus:bg-white rounded-xl px-3 py-2 text-xs text-slate-900 outline-none shadow-sm font-semibold cursor-pointer"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Date */}
            <div className="flex flex-col space-y-1">
              <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">
                Entry Date
              </label>
              <input
                type="date"
                value={formState.date}
                onChange={(e) => setFormState({ ...formState, date: e.target.value })}
                className="bg-slate-50 border border-slate-200 focus:border-amber-400 focus:bg-white rounded-xl px-3 py-2 text-xs text-slate-900 outline-none shadow-sm"
              />
            </div>

            {/* Pinned Checkbox */}
            <div className="flex items-center gap-2 pt-5">
              <button
                type="button"
                onClick={() => setFormState({ ...formState, pinned: !formState.pinned })}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all border ${
                  formState.pinned
                    ? "bg-amber-50 border-amber-300 text-amber-800"
                    : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                }`}
              >
                <Pin className={`w-3.5 h-3.5 ${formState.pinned ? "fill-amber-500 text-amber-500" : ""}`} />
                {formState.pinned ? "Pinned as Important" : "Pin to top"}
              </button>
            </div>
          </div>

          {/* Note Content Textarea */}
          <div className="flex flex-col space-y-1">
            <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">
              Note Details &amp; Observations (Optional)
            </label>
            <textarea
              rows={4}
              value={formState.content}
              onChange={(e) => setFormState({ ...formState, content: e.target.value })}
              placeholder="Write down your trade rules, setup details, psychological state, or key takeaways..."
              className="bg-slate-50 border border-slate-200 focus:border-amber-400 focus:bg-white rounded-xl px-3.5 py-2.5 text-xs text-slate-900 outline-none leading-relaxed shadow-sm resize-y"
            />
          </div>

          {/* Form Action Buttons */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              className="px-4 py-2 border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-black hover:bg-neutral-850 text-white text-xs font-bold rounded-xl transition-colors shadow-sm flex items-center gap-1.5"
            >
              <Check className="w-4 h-4 text-emerald-400" />
              {editingId ? "Update Note" : "Save Daily Note"}
            </button>
          </div>
        </form>
      )}

      {/* Search & Filter Control Toolbar */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 bg-white border border-slate-200 p-3 rounded-2xl shadow-sm">
        {/* Search Bar */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search daily notes by title, keyword, or rule..."
            className="w-full bg-slate-50 border border-slate-200 focus:border-slate-400 focus:bg-white text-xs pl-9 pr-3 py-2 rounded-xl outline-none text-slate-800 placeholder:text-slate-400"
          />
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-1 overflow-x-auto py-1 light-scroll">
          {["ALL", ...CATEGORIES].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                selectedCategoryFilter === cat
                  ? "bg-slate-900 text-white shadow-sm"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {cat === "ALL" ? "All Categories" : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Notes Grid */}
      {sortedNotes.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-sm">
          <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-700">No Daily Notes Found</h3>
          <p className="text-slate-400 text-xs mt-1">
            {searchQuery || selectedCategoryFilter !== "ALL"
              ? "No notes match your active search filter."
              : "Click 'Create Daily Note' above to record your first trading rule or observation."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sortedNotes.map((note) => (
            <div
              key={note.id}
              className={`bg-white border rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between relative group ${
                note.pinned ? "border-amber-300 ring-1 ring-amber-200/60 bg-amber-50/20" : "border-slate-200"
              }`}
            >
              <div>
                {/* Note Header: Pin + Title + Category */}
                <div className="flex justify-between items-start gap-2 mb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <button
                      onClick={() => handleTogglePin(note.id)}
                      title={note.pinned ? "Unpin note" : "Pin note to top"}
                      className={`p-1 rounded-lg transition-colors ${
                        note.pinned
                          ? "bg-amber-100 text-amber-700"
                          : "text-slate-300 hover:text-amber-500 hover:bg-slate-100"
                      }`}
                    >
                      <Pin className={`w-3.5 h-3.5 ${note.pinned ? "fill-amber-600 text-amber-600" : ""}`} />
                    </button>
                    <h3 className="text-sm font-bold text-slate-900 truncate">
                      {note.title}
                    </h3>
                  </div>

                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 uppercase tracking-wider flex-shrink-0">
                    {note.category || "General"}
                  </span>
                </div>

                {/* Date */}
                <div className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-400 mb-3">
                  <Calendar className="w-3 h-3 text-slate-400" />
                  <span>
                    {note.date ? new Date(note.date).toLocaleDateString(undefined, {
                      weekday: "short",
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    }) : "No Date"}
                  </span>
                </div>

                {/* Content */}
                {note.content && (
                  <p className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed font-sans mb-4">
                    {note.content}
                  </p>
                )}
              </div>

              {/* Card Footer Actions */}
              <div className="flex justify-end items-center gap-2 pt-3 border-t border-slate-100 text-xs">
                <button
                  onClick={() => handleEditNote(note)}
                  className="px-2.5 py-1 text-slate-600 hover:text-slate-900 font-bold hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-1"
                >
                  <Edit3 className="w-3.5 h-3.5 text-slate-500" />
                  Edit
                </button>
                <button
                  onClick={() => handleDeleteNote(note.id)}
                  className="px-2.5 py-1 text-slate-400 hover:text-red-600 font-bold hover:bg-red-50 rounded-lg transition-colors flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DailyNotes;
