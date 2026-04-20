import { useState } from "react";

export default function UploadForm({ reload }) {

  const [form, setForm] = useState({
    course: "", year: "", spec: "", sem: "", exam: "", name: "", index: ""
  });

  const [file, setFile] = useState(null);

  const handleChange = (k, v) => {
    setForm(prev => ({ ...prev, [k]: v }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const token = sessionStorage.getItem("token");

    const formData = new FormData();

    if (file) formData.append("file", file);

    Object.keys(form).forEach(k => {
      if (form[k]) formData.append(k, form[k]);
    });

    const res = await fetch(`${import.meta.env.VITE_API_URL}/upload`, {
      method: "POST",
      headers: {
        Authorization: "Bearer " + token
      },
      body: formData
    });

    alert(await res.text());
    reload();
  };

  return (
    <form onSubmit={handleSubmit}>

      <input type="file" onChange={e => setFile(e.target.files[0])} />

      <input placeholder="Course" onChange={e => handleChange("course", e.target.value)} />
      <input placeholder="Year" onChange={e => handleChange("year", e.target.value)} />
      <input placeholder="Spec" onChange={e => handleChange("spec", e.target.value)} />
      <input placeholder="Sem" onChange={e => handleChange("sem", e.target.value)} />
      <input placeholder="Exam" onChange={e => handleChange("exam", e.target.value)} />
      <input placeholder="Name" onChange={e => handleChange("name", e.target.value)} />

      <button type="submit">Upload</button>

    </form>
  );
}