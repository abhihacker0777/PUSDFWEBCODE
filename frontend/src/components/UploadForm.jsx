import { useState, useRef } from "react";

export default function UploadForm({ reload }) {
  const fileInputRef = useRef(null); 
  const [isUploading, setIsUploading] = useState(false); // BUG FIX: Prevent double-submission
  
  const [form, setForm] = useState({
    // BUG FIX: Changed 'spec' to 'specialization' to match your database/filters
    course: "", year: "", specialization: "", sem: "", exam: "", name: "", index: ""
  });

  const [file, setFile] = useState(null);

  const handleChange = (k, v) => {
    setForm(prev => ({ ...prev, [k]: v }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // BUG FIX: Added field validation to prevent empty records in the database
    const requiredFields = ["course", "year", "specialization", "sem", "exam", "name"];
    const isFormIncomplete = requiredFields.some(field => !form[field].trim());

    if (isFormIncomplete) {
      return alert("❌ All text fields are required.");
    }

    // BUG FIX: Ensure a file or index is present before hitting the server
    if (!file && !form.index) return alert("❌ Please Select A File First.");

    setIsUploading(true); // Start loading
    const token = sessionStorage.getItem("token");
    const formData = new FormData();

    if (file) formData.append("file", file);

    Object.keys(form).forEach(k => {
      // BUG FIX: Only append the index if it actually has a value to prevent server-side update errors
      if (form[k] && form[k] !== "") {
        formData.append(k === 'specialization' ? 'spec' : k, form[k]);
      }
    });

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/upload`, {
        method: "POST",
        headers: {
          Authorization: "Bearer " + token
        },
        body: formData
      });

      const message = await res.text();
      alert(message);

      if (message.includes("✅")) {
        // BUG FIX: Full state reset to ensure a clean slate for the next upload
        setForm({ course: "", year: "", specialization: "", sem: "", exam: "", name: "", index: "" });
        setFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = ""; 
        }
        reload();
      }
    } catch (err) {
      console.error(err);
      alert("❌ Upload Failed. Check Connection.");
    } finally {
      setIsUploading(false); // BUG FIX: Always re-enable button after attempt
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded-xl shadow-sm">
      <input 
        type="file" 
        ref={fileInputRef}
        onChange={e => setFile(e.target.files[0])} 
        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[#05488B] file:text-white hover:file:bg-blue-700"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <input 
          placeholder="Course" 
          value={form.course}
          onChange={e => handleChange("course", e.target.value)} 
          className="border p-2 rounded-lg outline-none focus:border-[#ffc107]"
        />
        <input 
          placeholder="Year" 
          value={form.year}
          onChange={e => handleChange("year", e.target.value)} 
          className="border p-2 rounded-lg outline-none focus:border-[#ffc107]"
        />
        <input 
          placeholder="Specialization" 
          value={form.specialization}
          onChange={e => handleChange("specialization", e.target.value)} 
          className="border p-2 rounded-lg outline-none focus:border-[#ffc107]"
        />
        <input 
          placeholder="Sem" 
          value={form.sem}
          onChange={e => handleChange("sem", e.target.value)} 
          className="border p-2 rounded-lg outline-none focus:border-[#ffc107]"
        />
        <input 
          placeholder="Exam" 
          value={form.exam}
          onChange={e => handleChange("exam", e.target.value)} 
          className="border p-2 rounded-lg outline-none focus:border-[#ffc107]"
        />
        <input 
          placeholder="Name" 
          value={form.name}
          onChange={e => handleChange("name", e.target.value)} 
          className="border p-2 rounded-lg outline-none focus:border-[#ffc107]"
        />
      </div>

      <button 
        type="submit"
        disabled={isUploading} // BUG FIX: Disable button while uploading
        className={`w-full font-bold py-3 rounded-lg transition-colors shadow-md ${
          isUploading ? "bg-gray-400 cursor-not-allowed" : "bg-[#ffc107] hover:bg-[#e6ae06] text-[#05488B]"
        }`}
      >
        {isUploading ? "Uploading..." : "Upload Paper"}
      </button>

    </form>
  );
}