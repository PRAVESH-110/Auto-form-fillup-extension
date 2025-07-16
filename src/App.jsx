import { useState, useEffect } from "react";
import "./index.css";

function App() {
  const [profiles, setProfiles] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  const [selected, setSelected] = useState(null);

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    pincode: "",
    country: "",
    dob: "",
    gender: "",
    college: ""
  });

  useEffect(() => {
    chrome.storage.local.get(["profiles"], (res) => {
      setProfiles(res.profiles || []);
    });
  }, []);

  const resetForm = () => {
    setForm({
      name: "",
      email: "",
      phone: "",
      address: "",
      city: "",
      pincode: "",
      country: "",
      dob: "",
      gender: "",
      college: ""
    });
    setIsEditing(false);
    setEditingIndex(null);
  };

  const saveProfile = () => {
    let updated;

    if (isEditing && editingIndex !== null) {
      updated = [...profiles];
      updated[editingIndex] = form;
    } else {
      updated = [...profiles, form];
    }

    chrome.storage.local.set({ profiles: updated }, () => {
      setProfiles(updated);
      resetForm();
    });
  };

  const editProfile = (index) => {
    setForm(profiles[index]);
    setIsEditing(true);
    setEditingIndex(index);
  };

  const fillForm = () => {
    if (selected == null) return;

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.scripting.executeScript({
        target: { tabId: tabs[0].id },
        func: (profile) => {
          const FIELD_KEYWORDS = {
            name: ["name", "full name"],
            email: ["email"],
            phone: ["phone", "mobile", "contact"],
            address: ["address", "addr", "location"],
            city: ["city", "town"],
            pincode: ["pincode", "zip", "postal"],
            country: ["country"],
            dob: ["dob", "birth", "date of birth"],
            gender: ["gender", "sex"],
            college: ["college", "institution", "university", "school"]
          };

          const inputs = document.querySelectorAll("input, select, textarea");

          inputs.forEach((input) => {
            const raw = `${input.name} ${input.id} ${input.placeholder} ${input.getAttribute("aria-label") || ""}`.toLowerCase();

            const matchField = (key) =>
              FIELD_KEYWORDS[key].some((keyword) => raw.includes(keyword));

            if (matchField("name")) input.value = profile.name;
            else if (matchField("email")) input.value = profile.email;
            else if (matchField("phone")) input.value = profile.phone;
            else if (matchField("address")) input.value = profile.address;
            else if (matchField("city")) input.value = profile.city;
            else if (matchField("pincode")) input.value = profile.pincode;
            else if (matchField("country")) input.value = profile.country;
            else if (matchField("dob")) input.value = profile.dob;
            else if (matchField("gender")) input.value = profile.gender;
            else if (matchField("college")) input.value = profile.college;
          });
        },
        args: [profiles[selected]],
      });
    });
  };

  return (
    <div style={{ padding: "1rem", width: "280px" }}>
      <h3>Select Profile</h3>
      <select onChange={(e) => setSelected(e.target.value)}>
        <option value="">-- Select --</option>
        {profiles.map((p, i) => (
          <option key={i} value={i}>
            {p.name}
          </option>
        ))}
      </select>
      <button onClick={fillForm} style={{ marginTop: "10px" }}>
        Fill Form
      </button>

      <hr />

      <h4>{isEditing ? "Edit Profile" : "Add New Profile"}</h4>

      <input placeholder="Full Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
      <input placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
      <input placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
      <input placeholder="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
      <input placeholder="City" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
      <input placeholder="Pincode" value={form.pincode} onChange={(e) => setForm({ ...form, pincode: e.target.value })} />
      <input placeholder="Country" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} />
      <input type="date" value={form.dob} onChange={(e) => setForm({ ...form, dob: e.target.value })} />
      <select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}>
        <option value="">Select Gender</option>
        <option value="male">Male</option>
        <option value="female">Female</option>
        <option value="other">Other</option>
      </select>
      <input placeholder="College/University" value={form.college} onChange={(e) => setForm({ ...form, college: e.target.value })} />

      <button onClick={saveProfile} style={{ marginTop: "10px" }}>
        {isEditing ? "Update Profile" : "Add Profile"}
      </button>
      {isEditing && (
        <button onClick={resetForm} style={{ marginLeft: "10px", backgroundColor: "#999", color: "#fff" }}>
          Cancel
        </button>
      )}

      <hr />
      <h4>Existing Profiles</h4>
      {profiles.map((p, i) => (
        <div key={i} style={{ marginBottom: "5px" }}>
          <b>{p.name}</b>
          <button onClick={() => editProfile(i)} style={{ marginLeft: "10px" }}>Edit</button>
        </div>
      ))}
    </div>
  );
}

export default App;
