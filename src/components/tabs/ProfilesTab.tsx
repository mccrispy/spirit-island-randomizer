import { useState } from "react";
import { isValidProfileName } from "../../persistence";
import { useAppState } from "../../state/AppStateContext";

export function ProfilesTab() {
  const {
    savedSets,
    saveNamedSet,
    loadNamedSet,
    deleteNamedSet,
    resetToDefault,
  } = useAppState();
  const [name, setName] = useState("");
  const [nameError, setNameError] = useState<string | null>(null);

  const sortedNames = Array.from(savedSets.keys()).sort((a, b) =>
    a.localeCompare(b),
  );

  const handleSave = () => {
    const trimmed = name.trim();
    if (!isValidProfileName(trimmed)) {
      setNameError(
        "Use 1-50 letters, numbers, spaces, hyphens, or underscores.",
      );
      return;
    }
    if (
      savedSets.has(trimmed) &&
      !window.confirm(`Overwrite the existing profile "${trimmed}"?`)
    ) {
      return;
    }
    saveNamedSet(trimmed);
    setName("");
    setNameError(null);
  };

  const handleDelete = (savedName: string) => {
    if (window.confirm(`Delete the profile "${savedName}"?`)) {
      deleteNamedSet(savedName);
    }
  };

  const handleReset = () => {
    if (
      window.confirm(
        "Reset your current selections and settings to the default values? This cannot be undone.",
      )
    ) {
      resetToDefault();
    }
  };

  return (
    <div className="profiles-tab">
      <section className="profiles-save">
        <h3>Save current setup as a profile</h3>
        <div className="profiles-save-row">
          <input
            className="profile-pill-input"
            type="text"
            value={name}
            maxLength={50}
            placeholder="Profile name"
            onChange={(event) => {
              setName(event.target.value);
              setNameError(null);
            }}
          />
          <button
            type="button"
            className="profile-pill profile-pill--primary"
            onClick={handleSave}
          >
            Save Profile
          </button>
        </div>
        {nameError && <p className="error">{nameError}</p>}
      </section>

      <section className="profiles-list">
        <h3>Saved profiles</h3>
        {sortedNames.length === 0 ? (
          <p>No saved profiles yet.</p>
        ) : (
          <ul>
            {sortedNames.map((savedName) => (
              <li key={savedName} className="profiles-list-item">
                <span>{savedName}</span>
                <div className="profiles-list-actions">
                  <button
                    type="button"
                    className="profile-pill profile-pill--load"
                    onClick={() => loadNamedSet(savedName)}
                  >
                    Load
                  </button>
                  <button
                    type="button"
                    className="profile-pill profile-pill--danger"
                    onClick={() => handleDelete(savedName)}
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="profiles-reset">
        <h3>Reset</h3>
        <div className="profiles-reset-row">
          <p>
            Restore the current selections and settings to the app defaults.
          </p>
          <button
            type="button"
            className="profile-pill profile-pill--danger"
            onClick={handleReset}
          >
            Reset to Default
          </button>
        </div>
      </section>
    </div>
  );
}
