<div className="modal-overlay" onClick={onClose}>
  <div className="modal-box" onClick={(e) => e.stopPropagation()}>

    <div className="modal-header">
      <div>
        <h2>Create New Project</h2>
        <p className="modal-sub">Post a project for students to apply</p>
      </div>
      <button className="modal-close" onClick={onClose}>✕</button>
    </div>

    <div className="modal-body">

      <div className="input-field">
        <label>Project Title *</label>
        <div className="input-wrap">
          <input placeholder="e.g. AI Research Assistant" />
        </div>
      </div>

      <div className="input-field">
        <label>Skills Required *</label>
        <div className="input-wrap">
          <input placeholder="e.g. Python, React, ML" />
        </div>
      </div>

      <div className="input-field">
        <label>Available Slots *</label>
        <div className="input-wrap">
          <input type="number" placeholder="e.g. 3" />
        </div>
      </div>

      <div className="input-field">
        <label>Project Description *</label>
        <textarea
          className="modal-textarea"
          placeholder="Describe the project requirements and goals..."
          rows={4}
        />
      </div>

    </div>

    <div className="modal-footer">
      <button className="btn-outline" onClick={onClose}>Cancel</button>
      <button className="btn-primary">Create Project →</button>
    </div>

  </div>
</div>