import React from "react";

import "./ConfirmModal.css"; 

const ConfirmModal = ({ visible, title, message, onConfirm, onCancel }) => {
  if (!visible) return null; // If not visible, render nothing

  return (
    <div className="my-modal-overlay">
      <div className="my-modal-container">
        <h3 className="my-modal-title">{title}</h3>
        <p className="my-modal-message">{message}</p>
        <div className="my-modal-buttons">
          <button className="my-confirm-button" onClick={onConfirm}>
            OK
          </button>
          <button className="my-cancel-button" onClick={onCancel}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
