import React from 'react';
import './styles/Modal.css'; // Make sure path to CSS is correct

const Modal = ({ children, isOpen, onClose, title }) => {
    if (!isOpen) return null;

    const handleContentClick = (e) => {
        e.stopPropagation();
    };

    return (
        <div className="modal-overlay-manage" onClick={onClose}>
            <div className="modal-content-manage" onClick={handleContentClick}>
                <div className="modal-header-manage">
                    <h2>{title || 'Modal Title'}</h2>
                    <button
                        className="modal-close-btn-manage"
                        onClick={onClose}
                        aria-label="Close modal"
                    >
                        ×
                    </button>
                </div>
                <div className="modal-body-manage">
                    {children}
                </div>
            </div>
        </div>
    );
};

export default Modal;