import { useState, useEffect } from "react";
import "./index.css";

function App() {
  const [profiles, setProfiles] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  const [selected, setSelected] = useState(null);

  const initialFormState = {
    firstName: "",
    lastName: "",
    fullName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    country: "",
    dob: "",
    gender: "",
    linkedin: "",
    github: "",
    portfolio: "",
    university: "",
    degree: "",
    major: "",
    gradYear: "",
    gpa: "",
    currentCompany: "",
    currentRole: "",
    skills: ""
  };

  const [form, setForm] = useState(initialFormState);

  useEffect(() => {
    chrome.storage.local.get(["profiles"], (res) => {
      setProfiles(res.profiles || []);
    });
  }, []);

  const resetForm = () => {
    setForm(initialFormState);
    setIsEditing(false);
    setEditingIndex(null);
  };

  const loadMyDetails = () => {
    setForm({
      firstName: "Pravesh",
      lastName: "Dhakal",
      fullName: "Pravesh Dhakal",
      email: "pravdhakal110@gmail.com",
      phone: "7021470826",
      address: "Jaipur, Rajasthan",
      city: "Jaipur",
      state: "Rajasthan",
      pincode: "",
      country: "India",
      dob: "",
      gender: "male",
      linkedin: "linkedin.com/in/pravesh-dhakal/",
      github: "github.com/PRAVESH-110",
      portfolio: "",
      university: "Arya college of engineering",
      degree: "B.Tech",
      major: "Computer Science",
      gradYear: "2026",
      gpa: "",
      currentCompany: "Creatik AI Solution",
      currentRole: "MERN stack developer",
      skills: "C/C++, JavaScript, React, Node.js, Next.js, Redux, Tailwind, MongoDB, TypeScript"
    });
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

  const deleteProfile = (index) => {
    const updated = profiles.filter((_, i) => i !== index);
    chrome.storage.local.set({ profiles: updated }, () => {
      setProfiles(updated);
      if (editingIndex === index) resetForm();
    });
  };

  const fillForm = () => {
    if (selected == null) return;

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.scripting.executeScript({
        target: { tabId: tabs[0].id },
        func: (profile) => {
          // Comprehensive list of keywords for better matching
          const FIELD_KEYWORDS = {
            firstName: ["first name", "firstname", "fname", "given name"],
            lastName: ["last name", "lastname", "lname", "surname", "family name"],
            fullName: ["full name", "fullname", "name", "your name"],
            email: ["email", "e-mail", "mail address", "email address"],
            phone: ["phone", "mobile", "cell", "contact", "telephone", "phone number", "mobile number"],
            address: ["address", "street", "mailing address", "residence"],
            city: ["city", "town", "district"],
            state: ["state", "province", "region"],
            pincode: ["pincode", "zip", "postal", "zipcode"],
            country: ["country", "nation"],
            dob: ["dob", "birth", "date of birth", "birthday"],
            gender: ["gender", "sex"],
            linkedin: ["linkedin", "linked-in", "linkedin profile", "linkedin url"],
            github: ["github", "git-hub", "github profile", "github url"],
            portfolio: ["portfolio", "website", "personal site", "webpage", "blog"],
            university: ["university", "college", "school", "institution", "institute", "alma mater"],
            degree: ["degree", "qualification", "course", "education level"],
            major: ["major", "department", "branch", "specialization", "field of study"],
            gradYear: ["graduation year", "passing year", "year of passing", "class of", "completion year"],
            gpa: ["gpa", "cgpa", "grade", "score", "percentage"],
            currentCompany: ["current company", "employer", "organization", "workplace", "company name"],
            currentRole: ["job title", "designation", "role", "position", "current position"],
            skills: ["skills", "technologies", "competencies", "key skills", "tech stack"]
          };

          const inputs = document.querySelectorAll("input, select, textarea");

          inputs.forEach((input) => {
            // Include parent text, label text (if explicit), placeholder, name, id
            // Often labels are not direct parents, but checking direct parent help. 
            // Better heuristic: Check for associated label tag, but simple parent/placeholder check works for many.

            let labelText = "";
            if (input.id) {
              const label = document.querySelector(`label[for='${input.id}']`);
              if (label) labelText = label.innerText;
            }

            const raw = `${input.name} ${input.id} ${input.placeholder || ""} ${input.getAttribute("aria-label") || ""} ${labelText} ${input.parentElement?.innerText || ""}`.toLowerCase();

            const getFieldMatch = () => {
              for (const [key, keywords] of Object.entries(FIELD_KEYWORDS)) {
                if (keywords.some((k) => raw.includes(k))) {
                  // Special logic: "First Name" vs "Full Name"
                  // If raw has "first name", matchedKey will be "firstName" (if iterate order matches)
                  // If FIELD_KEYWORDS order is indeterminate, it might be tricky.
                  // But usually "first name" is more specific than "name".
                  // However, logic below iterates keys. 

                  // Refinement: strict check for "name" to avoid matching "username" or "filename" if needed, 
                  // but "name" is in keywords.

                  // Conflict resolution:
                  if (key === "fullName" && (raw.includes("first") || raw.includes("last") || raw.includes("sur"))) return null;
                  return key;
                }
              }
              return null;
            };

            const matchedKey = getFieldMatch();

            if (matchedKey && profile[matchedKey]) {
              input.value = profile[matchedKey];
              input.dispatchEvent(new Event('input', { bubbles: true }));
              input.dispatchEvent(new Event('change', { bubbles: true }));
            }
          });
        },
        args: [profiles[selected]],
      });
    });
  };

  return (
    <div className="container">
      <header className="app-header">
        <h3>Auto Form Filler</h3>
      </header>

      <div className="card">
        <label className="section-label">Select Profile</label>
        <div className="row">
          <select onChange={(e) => setSelected(e.target.value)} className="profile-select">
            <option value="">-- Select --</option>
            {profiles.map((p, i) => (
              <option key={i} value={i}>
                {p.fullName || p.firstName || "Untitled Profile"}
              </option>
            ))}
          </select>
          <button onClick={fillForm} disabled={selected === null} className="primary-btn">Fill</button>
        </div>
      </div>

      <div className="card">
        <div className="row space-between">
          <h4 className="section-title">{isEditing ? "Edit Profile" : "New Profile"}</h4>
          {!isEditing && <button className="text-btn" onClick={loadMyDetails}>Load My Details</button>}
        </div>

        <div className="grid-2">
          <input placeholder="First Name" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
          <input placeholder="Last Name" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
        </div>
        <input className="full-width" placeholder="Full Name" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />

        <div className="grid-2">
          <input placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <input placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        </div>

        <div className="grid-3">
          <input placeholder="City" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
          <input placeholder="State" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} />
          <input placeholder="Country" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} />
        </div>

        <h5 className="sub-title">Social Links</h5>
        <input className="full-width" placeholder="LinkedIn URL" value={form.linkedin} onChange={(e) => setForm({ ...form, linkedin: e.target.value })} />
        <input className="full-width" placeholder="GitHub URL" value={form.github} onChange={(e) => setForm({ ...form, github: e.target.value })} />
        <input className="full-width" placeholder="Portfolio URL" value={form.portfolio} onChange={(e) => setForm({ ...form, portfolio: e.target.value })} />

        <h5 className="sub-title">Education & Work</h5>
        <div className="grid-2">
          <input placeholder="University" value={form.university} onChange={(e) => setForm({ ...form, university: e.target.value })} />
          <input placeholder="Degree" value={form.degree} onChange={(e) => setForm({ ...form, degree: e.target.value })} />
        </div>
        <div className="grid-2">
          <input placeholder="Major" value={form.major} onChange={(e) => setForm({ ...form, major: e.target.value })} />
          <input placeholder="Grad Year" value={form.gradYear} onChange={(e) => setForm({ ...form, gradYear: e.target.value })} />
        </div>
        <div className="grid-2">
          <input placeholder="Current Company" value={form.currentCompany} onChange={(e) => setForm({ ...form, currentCompany: e.target.value })} />
          <input placeholder="Current Role" value={form.currentRole} onChange={(e) => setForm({ ...form, currentRole: e.target.value })} />
        </div>

        <h5 className="sub-title">Skills</h5>
        <textarea
          className="full-width"
          placeholder="Skills (comma separated)"
          value={form.skills}
          onChange={(e) => setForm({ ...form, skills: e.target.value })}
          rows={3}
        />

        <div className="action-buttons">
          <button onClick={saveProfile} className="primary-btn">
            {isEditing ? "Update Profile" : "Save Profile"}
          </button>
          {isEditing && (
            <button onClick={resetForm} className="cancel-btn">
              Cancel
            </button>
          )}
        </div>
      </div>

      <div className="card">
        <h4 className="section-title">Saved Profiles</h4>
        {profiles.length === 0 ? <p className="empty-msg">No profiles saved.</p> : profiles.map((p, i) => (
          <div key={i} className="profile-item">
            <span className="profile-name">{p.fullName || p.firstName}</span>
            <div className="profile-actions">
              <button onClick={() => editProfile(i)} className="icon-btn">✏️</button>
              <button onClick={() => deleteProfile(i)} className="icon-btn delete">🗑️</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
