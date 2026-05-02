import { useState } from 'react';
import './OnboardingModal.css';

const EXAMPLE_DISEASES = [
  "Parkinson's Disease",
  'Lung Cancer',
  'Type 2 Diabetes',
  "Alzheimer's Disease",
  'Heart Disease',
  'Multiple Sclerosis',
  'Rheumatoid Arthritis',
  'Breast Cancer',
];

export default function OnboardingModal({ onSubmit }) {
  const [form, setForm] = useState({
    patientName: '',
    disease: '',
    additionalQuery: '',
    location: '',
  });
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleExampleClick = (disease) => {
    setForm((prev) => ({ ...prev, disease }));
    if (errors.disease) setErrors((prev) => ({ ...prev, disease: '' }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};
    if (!form.disease.trim()) newErrors.disease = 'Please enter a disease or condition.';
    if (Object.keys(newErrors).length) { setErrors(newErrors); return; }

    onSubmit({
      patientName: form.patientName.trim(),
      disease: form.disease.trim(),
      additionalContext: form.additionalQuery.trim(),
      location: form.location.trim(),
    });
  };

  return (
    <div className="modal-overlay">
      <div className="modal-card animate-fade-in">
        {/* Header */}
        <div className="modal-header">
          <div className="modal-logo">
            <span className="logo-icon">🔬</span>
            <div>
              <h1 className="modal-title">CuraLink</h1>
              <p className="modal-subtitle">AI Medical Research Assistant</p>
            </div>
          </div>
          <p className="modal-description">
            Enter your research context below. CuraLink will search thousands of
            peer-reviewed publications and clinical trials to give you personalised,
            source-backed answers.
          </p>
        </div>

        {/* Form */}
        <form className="modal-form" onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="patientName">
                Patient Name <span className="optional">(optional)</span>
              </label>
              <input
                id="patientName"
                name="patientName"
                type="text"
                className="form-input"
                placeholder="e.g. John Smith"
                value={form.patientName}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="location">
                Location <span className="optional">(optional)</span>
              </label>
              <input
                id="location"
                name="location"
                type="text"
                className="form-input"
                placeholder="e.g. Toronto, Canada"
                value={form.location}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="disease">
              Disease / Condition <span className="required">*</span>
            </label>
            <input
              id="disease"
              name="disease"
              type="text"
              className={`form-input ${errors.disease ? 'input-error' : ''}`}
              placeholder="e.g. Parkinson's disease"
              value={form.disease}
              onChange={handleChange}
              autoFocus
            />
            {errors.disease && <p className="error-msg">{errors.disease}</p>}

            <div className="examples-row">
              {EXAMPLE_DISEASES.map((d) => (
                <button
                  key={d}
                  type="button"
                  className={`example-pill ${form.disease === d ? 'active' : ''}`}
                  onClick={() => handleExampleClick(d)}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="additionalQuery">
              Initial Query / Focus Area <span className="optional">(optional)</span>
            </label>
            <textarea
              id="additionalQuery"
              name="additionalQuery"
              className="form-input form-textarea"
              placeholder="e.g. Latest treatment options, Deep Brain Stimulation, clinical trials near me..."
              value={form.additionalQuery}
              onChange={handleChange}
              rows={3}
            />
          </div>

          <button type="submit" className="btn-start">
            <span>Start Research Session</span>
            <span className="btn-arrow">→</span>
          </button>
        </form>

        {/* Footer note */}
        <p className="modal-note">
          🔒 Your data stays in your session only. CuraLink retrieves from OpenAlex, PubMed &amp; ClinicalTrials.gov.
        </p>
      </div>
    </div>
  );
}