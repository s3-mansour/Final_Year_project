import React, { useState } from "react";
import Modal from "react-modal";
import "./styles/MedicationForm.css";

Modal.setAppElement("#root");

const MedicationForm = ({ selectedDate, closeForm }) => {
  const [formData, setFormData] = useState({
    reason: "",
    product: "",
    comments: "",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    alert(`Medication added for ${selectedDate.toDateString()}`);
    closeForm();
  };

  return (
    <Modal isOpen={true} onRequestClose={closeForm} className="modal-style" overlayClassName="modal-overlay">
      <h2>New Treatment</h2>
      <p>Selected Date: {selectedDate.toDateString()}</p>

      <form onSubmit={handleSubmit}>
        <label>Reason:</label>
        <select name="reason" onChange={handleChange} required>
          <option value="">Select Reason...</option>
          <option value="Prophylaxis">Prophylaxis</option>
          <option value="Emergency Dose">Emergency Dose</option>
          <option value="Follow-up">Follow-up</option>
        </select>

        <label>Product:</label>
        <select name="product" onChange={handleChange} required>
          <option value="">Select Product...</option>
          <option value="Hemlibra">Hemlibra</option>
          <option value="Factor VIII">Factor VIII</option>
        </select>

        <label>Comments (Optional):</label>
        <textarea name="comments" placeholder="Any specific notes..." onChange={handleChange}></textarea>

        <button type="submit" className="submit-btn">Save Treatment</button>
      </form>

      <button className="close-btn" onClick={closeForm}>Close</button>
    </Modal>
  );
};

export default MedicationForm;
