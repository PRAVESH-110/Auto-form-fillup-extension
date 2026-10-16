import { useState, useEffect } from "react";
import "./index.css";

function App() {
  const [profiles, setProfiles] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  const [selected, setSelected] = useState("");
  const [fillStatus, setFillStatus] = useState("");

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
    if (selected === "") {
      setFillStatus("Choose a profile first.");
      return;
    }

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (!tabs[0]?.id) {
        setFillStatus("Open a job application page in a normal Chrome tab first.");
        return;
      }

      chrome.scripting.executeScript({
        target: { tabId: tabs[0].id },
        func: (profile) => {
          const keywords = {
            firstName: ["first name", "firstname", "given name", "givenname", "forename", "fname"],
            lastName: ["last name", "lastname", "family name", "familyname", "surname", "lname"],
            fullName: ["full name", "fullname", "your name", "candidate name", "applicant name", "name"],
            email: ["email address", "e-mail", "email"],
            phone: ["phone number", "mobile number", "telephone", "mobile", "phone"],
            address: ["street address", "streetaddress", "mailing address", "address line", "addressline", "address"],
            city: ["city", "town"], state: ["state", "province"],
            pincode: ["postal code", "postcode", "zip code", "pincode", "zip"],
            country: ["country"], dob: ["date of birth", "birth date", "birthday", "dob"],
            gender: ["gender", "sex"], linkedin: ["linkedin"], github: ["github"],
            portfolio: ["portfolio", "personal website", "website"],
            university: ["university", "college", "institution", "school"],
            degree: ["degree", "qualification", "education level"],
            major: ["field of study", "specialization", "major", "department"],
            gradYear: ["graduation year", "year of graduation", "year of passing", "passing year"],
            gpa: ["gpa", "cgpa", "percentage"],
            currentCompany: ["current company", "company name", "employer", "organization"],
            currentRole: ["job title", "current role", "designation", "current position"],
            skills: ["key skills", "technical skills", "skills", "technologies"]
          };
          const normalize = (text) => (text || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
          const fields = Object.entries(keywords).flatMap(([key, terms]) =>
            terms.map((term) => ({ key, term: normalize(term) }))
          ).sort((a, b) => b.term.length - a.term.length);
          const controls = document.querySelectorAll("input, select, textarea");
          const handledRadioGroups = new Set();
          let filled = 0;
          let skipped = 0;

          for (const control of controls) {
            try {
              const type = (control.type || "").toLowerCase();
              if (control.disabled || control.readOnly || ["hidden", "password", "submit", "button", "reset", "file", "image"].includes(type)) continue;
              if (type === "checkbox") continue;
              const currentValue = normalize(control.value);
              const isPlaceholder = control instanceof HTMLSelectElement && (!currentValue || /^(select|choose|please select|select one)$/.test(currentValue));
              if (type !== "radio" && String(control.value || "").trim() && !isPlaceholder) { skipped++; continue; }

              const labelledBy = (control.getAttribute("aria-labelledby") || "").split(/\s+/)
                .map((id) => document.getElementById(id)?.innerText || "").join(" ");
              const wrappingLabel = control.closest("label")?.innerText || "";
              const explicitLabels = Array.from(control.labels || []).map((label) => label.innerText || "").join(" ");
              const legend = control.closest("fieldset")?.querySelector("legend")?.innerText || "";
              const clues = normalize([
                control.name, control.id, control.placeholder, control.getAttribute("aria-label"),
                control.autocomplete, labelledBy, wrappingLabel, explicitLabels, legend
              ].join(" "));
              const match = fields.find(({ term }) => (` ${clues} `).includes(` ${term} `));
              if (!match || !profile[match.key]) { skipped++; continue; }

              const value = String(profile[match.key]);
              if (type === "radio") {
                if (!control.name || handledRadioGroups.has(control.name)) continue;
                handledRadioGroups.add(control.name);
                const radioGroup = Array.from(document.querySelectorAll("input[type=radio]")).filter((item) => item.name === control.name);
                const option = radioGroup.find((item) => {
                  const optionText = normalize(`${item.value} ${item.labels ? Array.from(item.labels).map((l) => l.innerText).join(" ") : ""}`);
                  return optionText === normalize(value) || (` ${optionText} `).includes(` ${normalize(value)} `);
                });
                if (!option) { skipped++; continue; }
                option.checked = true;
                option.dispatchEvent(new Event("change", { bubbles: true }));
                filled++;
                continue;
              }

              if (control instanceof HTMLSelectElement) {
                const option = Array.from(control.options).find((item) => normalize(item.value) === normalize(value) || normalize(item.text) === normalize(value));
                if (!option) { skipped++; continue; }
                control.value = option.value;
                control.dispatchEvent(new Event("change", { bubbles: true }));
                filled++;
                continue;
              }

              if (control instanceof HTMLInputElement && ["email", "tel", "url", "date", "number"].includes(type)) {
                if (type === "date" && !/^\d{4}-\d{2}-\d{2}$/.test(value)) { skipped++; continue; }
                if (type === "number" && Number.isNaN(Number(value))) { skipped++; continue; }
              }
              const proto = control instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
              Object.getOwnPropertyDescriptor(proto, "value").set.call(control, value);
              control.dispatchEvent(new Event("input", { bubbles: true }));
              control.dispatchEvent(new Event("change", { bubbles: true }));
              filled++;
            } catch {
              skipped++;
            }
          }
          return { filled, skipped };
        },
        args: [profiles[Number(selected)]],
      }).then((results) => {
        const summary = results?.[0]?.result;
        setFillStatus(summary ? `Filled ${summary.filled} fields${summary.skipped ? `; skipped ${summary.skipped}.` : "."}` : "No form fields found on this page.");
      }).catch(() => {
        setFillStatus("Chrome could not access this page. Try a regular job application tab, then click Fill again.");
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
          <button onClick={fillForm} disabled={selected === ""} className="primary-btn">Fill</button>
        </div>
        {fillStatus && <p role="status" className="empty-msg">{fillStatus}</p>}
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
        <input className="full-width" placeholder="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
        <input className="full-width" placeholder="Postal / PIN Code" value={form.pincode} onChange={(e) => setForm({ ...form, pincode: e.target.value })} />

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
