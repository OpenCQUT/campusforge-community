export default function ApplyPage() {
  return (
    <main className="page">
      <div className="page-header">
        <h1 className="page-title">Request Invitation</h1>
        <p className="page-subtitle">
          Submit your application to join the CampusForge community. An admin
          will review your request.
        </p>
      </div>

      <div className="apply-layout">
        <div className="apply-form">
          <div className="glass-card form-card">
            <h2>Application Form</h2>
            <form className="form-grid">
              <div className="form-row">
                <div className="field">
                  <label htmlFor="email">School Email</label>
                  <input
                    id="email"
                    type="email"
                    placeholder="you@school.edu"
                  />
                </div>
                <div className="field">
                  <label htmlFor="studentId">Student ID</label>
                  <input
                    id="studentId"
                    type="text"
                    placeholder="2024001"
                  />
                </div>
              </div>

              <div className="field">
                <label htmlFor="department">Department</label>
                <input
                  id="department"
                  type="text"
                  placeholder="Computer Science"
                />
              </div>

              <div className="field">
                <label htmlFor="reason">
                  Why do you want to join?
                </label>
                <textarea
                  id="reason"
                  placeholder="Tell us about your interests and what you hope to contribute..."
                  rows={5}
                />
              </div>

              <div className="form-actions">
                <button type="submit" className="btn btn-primary">
                  Submit Application
                </button>
                <button type="reset" className="btn btn-ghost">
                  Clear
                </button>
              </div>
            </form>
          </div>
        </div>

        <aside className="apply-sidebar">
          <div className="glass-card info-card">
            <h3>What happens next?</h3>
            <p>
              After you submit your application, an admin will review your
              request. You can check the status at any time.
            </p>
            <ul>
              <li>Application submitted</li>
              <li>Admin review</li>
              <li>Decision notification</li>
            </ul>
          </div>

          <div className="glass-card info-card" style={{ marginTop: 16 }}>
            <h3>Eligibility</h3>
            <p>
              You need a valid school email address and a student ID.
              Applications are reviewed based on community guidelines.
            </p>
          </div>
        </aside>
      </div>
    </main>
  );
}
