import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  AlertCircle,
  Check,
  ClipboardCheck,
  ImagePlus,
  Loader2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

import api from "../../api/client";
import { getCategories, logAction, uploadImage } from "../../api/client";

const FIELD_LABELS = {
  item_name: "Item",
  description: "Details",
  budget_min: "Min budget",
  budget_max: "Max budget",
  pincode: "Pincode",
  category_id: "Category",
  urgency: "Urgency",
};

const URGENCY_OPTIONS = [
  { value: "flexible", label: "Flexible" },
  { value: "soon", label: "Soon" },
  { value: "urgent", label: "Urgent" },
];

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE = 5 * 1024 * 1024;

export default function AssistantPreview({
  draft,
  missingFields,
  lowConfidenceFields,
  logId,
  onCancel,
}) {
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();

  const [form, setForm] = useState({ ...draft });
  const [categories, setCategories] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [originalDraft] = useState({ ...draft });
  const fileInputRef = useRef(null);

  useEffect(() => {
    getCategories()
      .then(setCategories)
      .catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview);
    };
  }, [imagePreview]);

  const updateField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const computeEditedFields = () => {
    const edited = {};
    for (const key of Object.keys(originalDraft)) {
      if (key === "confidence") continue;
      if (form[key] !== originalDraft[key]) edited[key] = form[key];
    }
    return edited;
  };

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error("Only JPG, PNG, or WEBP images are allowed");
      return;
    }
    if (file.size > MAX_SIZE) {
      toast.error("Image must be under 5MB");
      return;
    }

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const removeImage = () => {
    setImageFile(null);
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleConfirm = async () => {
    const required = ["item_name", "budget_min", "budget_max", "pincode"];
    const stillMissing = required.filter((f) => !form[f]);
    if (stillMissing.length > 0) {
      toast.error(`Please fill: ${stillMissing.join(", ")}`);
      return;
    }

    setSubmitting(true);

    let referenceImageUrl = null;
    if (imageFile) {
      setUploading(true);
      try {
        referenceImageUrl = await uploadImage(imageFile);
      } catch (err) {
        const msg =
          err?.response?.data?.detail || "Failed to upload image";
        toast.error(typeof msg === "string" ? msg : "Failed to upload image");
        setUploading(false);
        setSubmitting(false);
        return;
      }
      setUploading(false);
    }

    const editedFields = computeEditedFields();
    const action =
      Object.keys(editedFields).length > 0 ? "edited" : "accepted";

    logAction(logId, action, editedFields).catch(() => {});

    let categoryName = "electronics";
    if (form.category_id && categories.length > 0) {
      const match = categories.find((c) => c.id === form.category_id);
      if (match) categoryName = match.name;
    }

    const payload = {
      item_name: form.item_name,
      description: form.description || null,
      budget_min: Number(form.budget_min),
      budget_max: Number(form.budget_max),
      pincode: form.pincode,
      category: categoryName,
      image_urls: referenceImageUrl ? [referenceImageUrl] : [],
    };

    try {
      const { data } = await api.post("/requests", payload);
      toast.success("Request submitted");
      navigate(`/buyer/request/${data.id}`);
    } catch (err) {
      const detail =
        err?.response?.data?.detail || "Failed to submit request";
      toast.error(typeof detail === "string" ? detail : "Failed to submit");
      setSubmitting(false);
    }
  };

  const handleCancel = async () => {
    logAction(logId, "abandoned").catch(() => {});
    onCancel();
  };

  const isMissing = (key) => missingFields.includes(key);
  const isLowConf = (key) => lowConfidenceFields.includes(key);

  return (
    <motion.div
      initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
      className="p-4 flex flex-col gap-4"
    >
      {/* Section header */}
      <div className="flex items-center gap-2.5">
        <span className="w-7 h-7 rounded-full grid place-items-center
                         bg-[#1A1A2E] text-[#FFFCE1]">
          <ClipboardCheck size={13} strokeWidth={2.2} />
        </span>
        <span className="text-[12px] font-semibold text-[#1A1A2E] tracking-tight">
          Review extracted details
        </span>
      </div>

      {/* Fields */}
      <div className="flex flex-col gap-3 max-h-[420px] overflow-y-auto pr-1
                      [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <FieldRow
          label={FIELD_LABELS.item_name}
          missing={isMissing("item_name")}
          lowConf={isLowConf("item_name")}
        >
          <input
            type="text"
            value={form.item_name || ""}
            onChange={(e) => updateField("item_name", e.target.value)}
            className={inputClass(isMissing("item_name"))}
          />
        </FieldRow>

        <FieldRow
          label={FIELD_LABELS.description}
          missing={isMissing("description")}
          lowConf={isLowConf("description")}
        >
          <input
            type="text"
            value={form.description || ""}
            onChange={(e) => updateField("description", e.target.value)}
            className={inputClass(isMissing("description"))}
          />
        </FieldRow>

        <div className="grid grid-cols-2 gap-3">
          <FieldRow
            label={FIELD_LABELS.budget_min}
            missing={isMissing("budget_min")}
            lowConf={isLowConf("budget")}
          >
            <input
              type="number"
              value={form.budget_min ?? ""}
              onChange={(e) =>
                updateField(
                  "budget_min",
                  e.target.value === "" ? null : Number(e.target.value)
                )
              }
              className={inputClass(isMissing("budget_min"))}
            />
          </FieldRow>
          <FieldRow
            label={FIELD_LABELS.budget_max}
            missing={isMissing("budget_max")}
            lowConf={isLowConf("budget")}
          >
            <input
              type="number"
              value={form.budget_max ?? ""}
              onChange={(e) =>
                updateField(
                  "budget_max",
                  e.target.value === "" ? null : Number(e.target.value)
                )
              }
              className={inputClass(isMissing("budget_max"))}
            />
          </FieldRow>
        </div>

        <FieldRow
          label={FIELD_LABELS.pincode}
          missing={isMissing("pincode")}
          lowConf={isLowConf("pincode")}
        >
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            value={form.pincode || ""}
            onChange={(e) =>
              updateField("pincode", e.target.value.replace(/\D/g, ""))
            }
            className={inputClass(isMissing("pincode"))}
          />
        </FieldRow>

        <FieldRow
          label={FIELD_LABELS.category_id}
          missing={isMissing("category_id")}
          lowConf={isLowConf("category")}
        >
          <select
            value={form.category_id || ""}
            onChange={(e) =>
              updateField("category_id", e.target.value || null)
            }
            className={inputClass(isMissing("category_id"))}
          >
            <option value="">— Select category —</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </FieldRow>

        <FieldRow
          label={FIELD_LABELS.urgency}
          missing={isMissing("urgency")}
          lowConf={isLowConf("urgency")}
        >
          <select
            value={form.urgency || ""}
            onChange={(e) => updateField("urgency", e.target.value || null)}
            className={inputClass(isMissing("urgency"))}
          >
            <option value="">— Select urgency —</option>
            {URGENCY_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </FieldRow>

        {/* Image upload */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-medium text-[#A0A0B0] uppercase tracking-wide">
            Reference image · optional
          </label>

          {imagePreview ? (
            <div className="relative rounded-xl overflow-hidden
                            ring-1 ring-[#1A1A2E]/5">
              <img
                src={imagePreview}
                alt="preview"
                className="w-full h-32 object-cover"
              />
              <button
                type="button"
                onClick={removeImage}
                disabled={submitting || uploading}
                className="absolute top-2 right-2 bg-[#1A1A2E]/80 hover:bg-[#1A1A2E]
                           text-[#FFFCE1] rounded-full p-1.5 transition
                           disabled:opacity-50
                           focus:outline-none focus-visible:ring-2
                           focus-visible:ring-[#FFBE91]"
                aria-label="Remove image"
              >
                <X size={12} strokeWidth={2.2} />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={submitting || uploading}
              className="flex items-center justify-center gap-2
                         rounded-xl bg-[#F8F6F0]/60 hover:bg-[#F8F6F0]
                         py-5 cursor-pointer transition w-full
                         disabled:opacity-50 disabled:cursor-not-allowed
                         focus:outline-none focus-visible:ring-2
                         focus-visible:ring-[#FFBE91]/40"
            >
              <ImagePlus size={16} className="text-[#A0A0B0]" />
              <span className="text-[11px] text-[#4A4A5A] font-medium">
                Add a reference image
              </span>
            </button>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleImageSelect}
            className="hidden"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-3 border-t border-[#EEECE6]">
        <button
          onClick={handleCancel}
          disabled={submitting || uploading}
          className="inline-flex items-center gap-1.5 rounded-full
                     px-3 py-1.5 text-[11px] font-medium
                     text-[#4A4A5A] hover:text-[#1A1A2E] hover:bg-[#F8F6F0]
                     transition-colors duration-150
                     disabled:opacity-50
                     focus:outline-none focus-visible:ring-2
                     focus-visible:ring-[#FFBE91]"
        >
          <X size={12} strokeWidth={2.2} />
          Cancel
        </button>
        <button
          onClick={handleConfirm}
          disabled={submitting || uploading}
          className="inline-flex items-center gap-1.5 rounded-full
                     bg-[#1A1A2E] px-4 py-1.5 text-[11px] font-medium
                     text-[#FFFCE1] hover:bg-[#2A2A3E]
                     transition-colors duration-150
                     disabled:opacity-50 disabled:cursor-not-allowed
                     focus:outline-none focus-visible:ring-2
                     focus-visible:ring-[#FFBE91] focus-visible:ring-offset-2
                     focus-visible:ring-offset-white"
        >
          {submitting || uploading ? (
            <>
              <Loader2 size={12} strokeWidth={2.2} className="animate-spin" />
              {uploading ? "Uploading…" : "Submitting…"}
            </>
          ) : (
            <>
              <Check size={12} strokeWidth={2.2} />
              Confirm & Post
            </>
          )}
        </button>
      </div>
    </motion.div>
  );
}

/* ---------- Field row ---------- */
function FieldRow({ label, missing, lowConf, children }) {
  const reduceMotion = useReducedMotion();
  return (
    <div className="flex flex-col gap-1.5">
      <label className="flex items-center gap-1.5 text-[11px] font-medium
                        text-[#A0A0B0] uppercase tracking-wide">
        {label}
        {missing && (
          <motion.span
            animate={reduceMotion ? {} : { opacity: [1, 0.4, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="text-amber-500 inline-flex"
          >
            <AlertCircle size={11} strokeWidth={2.2} />
          </motion.span>
        )}
        {!missing && lowConf && (
          <span className="text-[10px] text-[#A0A0B0]/70 font-normal
                           normal-case tracking-normal">
            · low confidence
          </span>
        )}
      </label>
      {children}
    </div>
  );
}

/* ---------- Input styling ---------- */
function inputClass(isMissing) {
  const base =
    "w-full rounded-lg border px-3 py-2 text-[12px] text-[#1A1A2E] " +
    "transition-all duration-150 " +
    "focus:outline-none focus:ring-2 focus:ring-[#FFBE91]/40 focus:border-[#FFBE91]";
  return isMissing
    ? `${base} border-amber-300 bg-amber-50/40`
    : `${base} border-[#EEECE6] bg-white hover:border-[#1A1A2E]/20`;
}