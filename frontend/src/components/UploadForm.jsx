import { useState, useRef } from "react";
import { BACKEND_URL, csrfFetch } from "../services/api";

export default function UploadForm({ reload }) {
  const fileInputRef = useRef(null); 
  const [isUploading, setIsUploading] = useState(false);
  const [statusMsg, setStatusMsg] = useState({ text: "", type: "" }); // Replaces alert()
  
  const [form, setForm] = useState({
    course: "", year: "", specialization: "", sem: "", exam: "", name: "", index: ""
  });

  const [file, setFile] = useState(null);

  const handleChange = (k, v) => {
    setForm(prev => ({ ...prev, [k]: v }));
    // Clear status message when user starts typing again
    if (statusMsg.text) setStatusMsg({ text: "", type: "" }); 
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatusMsg({ text: "", type: "" });

    const requiredFields = ["course", "year", "specialization", "sem", "exam", "name"];
    const isFormIncomplete = requiredFields.some(field => !form[field].trim());

    if (isFormIncomplete) {
      return setStatusMsg({ text: "❌ All text fields are required.", type: "error" });
    }

    if (!file && !form.index) {
      return setStatusMsg({ text: "❌ Please Select A File First.", type: "error" });
    }

    setIsUploading(true);
    const formData = new FormData();

    if (file) formData.append("file", file);

    Object.keys(form).forEach(k => {
      if (form[k] && form[k] !== "") {
        formData.append(k === 'specialization' ? 'spec' : k, form[k]);
      }
    });

    try {
      const res = await csrfFetch(`${BACKEND_URL}/upload`, {
        method: "POST",        credentials: "include", 
        body: formData
      });

      const message = await res.text();

      if (res.ok) {
        setStatusMsg({ text: `✅ ${message}`, type: "success" });
        setForm({ course: "", year: "", specialization: "", sem: "", exam: "", name: "", index: "" });
        setFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = ""; 
        }
        reload();
      } else {
        setStatusMsg({ text: `❌ ${message}`, type: "error" });
      }
    } catch (err) {
      console.error(err);
      setStatusMsg({ text: "❌ Upload Failed. Check Connection.", type: "error" });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded-xl shadow-sm">      {statusMsg.text && (
        <div className={`p-3 rounded-lg font-medium text-sm ${statusMsg.type === "success" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
          {statusMsg.text}
        </div>
      )}

      <input 
        type="file" 
        ref={fileInputRef}
        onChange={e => setFile(e.target.files[0])} 
        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[#05488B] file:text-white hover:file:bg-blue-700 focus:outline-none"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <input placeholder="Course" value={form.course} onChange={e => handleChange("course", e.target.value)} className="border p-2 rounded-lg outline-none focus:border-[#ffc107]" />
        <input placeholder="Year" value={form.year} onChange={e => handleChange("year", e.target.value)} className="border p-2 rounded-lg outline-none focus:border-[#ffc107]" />
        <input placeholder="Specialization" value={form.specialization} onChange={e => handleChange("specialization", e.target.value)} className="border p-2 rounded-lg outline-none focus:border-[#ffc107]" />
        <input placeholder="Sem" value={form.sem} onChange={e => handleChange("sem", e.target.value)} className="border p-2 rounded-lg outline-none focus:border-[#ffc107]" />
        <input placeholder="Exam" value={form.exam} onChange={e => handleChange("exam", e.target.value)} className="border p-2 rounded-lg outline-none focus:border-[#ffc107]" />
        <input placeholder="Name" value={form.name} onChange={e => handleChange("name", e.target.value)} className="border p-2 rounded-lg outline-none focus:border-[#ffc107]" />
      </div>

      <button 
        type="submit"
        disabled={isUploading}
        className={`w-full font-bold py-3 rounded-lg transition-colors shadow-md ${
          isUploading ? "bg-gray-400 cursor-not-allowed" : "bg-[#ffc107] hover:bg-[#e6ae06] text-[#05488B]"
        }`}
      >
        {isUploading ? "Uploading..." : "Upload Paper"}
      </button>
    </form>
  );
}
