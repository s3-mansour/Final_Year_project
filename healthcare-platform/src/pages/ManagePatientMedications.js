import React, { useState, useEffect, useCallback } from 'react';
import * as consultantService from '../services/consultantService';
import * as medicationService from '../services/medicationService';
import './styles/ManagePatientMedications.css'; // Create this CSS file

// Basic Modal Component (can be moved to a separate file)
const Modal = ({ children, isOpen, onClose, title }) => {
    if (!isOpen) return null;
    return (
        <div className="modal-overlay-manage">
            <div className="modal-content-manage">
                <div className="modal-header-manage">
                    <h2>{title}</h2>
                    <button className="modal-close-btn-manage" onClick={onClose}>×</button>
                </div>
                <div className="modal-body-manage">
                    {children}
                </div>
            </div>
        </div>
    );
};

const ManagePatientMedications = () => {
    const [patients, setPatients] = useState([]);
    const [selectedPatientId, setSelectedPatientId] = useState('');
    const [selectedPatientName, setSelectedPatientName] = useState(''); // To display name easily
    const [medications, setMedications] = useState([]);
    const [isLoadingPatients, setIsLoadingPatients] = useState(false);
    const [isLoadingMedications, setIsLoadingMedications] = useState(false);
    const [error, setError] = useState(''); // General error display

    // Modal/Form State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentMedication, setCurrentMedication] = useState(null); // null for Add, object for Edit
    const [formData, setFormData] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [modalError, setModalError] = useState('');

    // Fetch patient list on mount
    useEffect(() => {
        const loadPatients = async () => {
            setIsLoadingPatients(true);
            setError('');
            try {
                const data = await consultantService.getPatientsList();
                setPatients(Array.isArray(data) ? data : []);
            } catch (err) {
                setError('Failed to load patients.');
                console.error(err);
                setPatients([]);
            } finally {
                setIsLoadingPatients(false);
            }
        };
        loadPatients();
    }, []);

    // Fetch medications when a patient is selected
    const fetchMedicationsForPatient = useCallback(async (patientId) => {
        if (!patientId) {
            setMedications([]); // Clear meds if no patient selected
            return;
        }
        setIsLoadingMedications(true);
        setError(''); // Clear previous errors
        try {
            // Call updated service function with patientId
            const data = await medicationService.getMedications(patientId);
            setMedications(Array.isArray(data) ? data : []);
        } catch (err) {
            setError(`Failed to load medications for selected patient.`);
            console.error(err);
            setMedications([]);
        } finally {
            setIsLoadingMedications(false);
        }
    }, []); // No dependencies needed here as it's called explicitly

    // Handler for patient selection change
    const handlePatientSelect = (e) => {
        const patientId = e.target.value;
        setSelectedPatientId(patientId);
        if (patientId) {
            const patient = patients.find(p => p._id === patientId);
            setSelectedPatientName(patient ? `${patient.firstName} ${patient.lastName}` : '');
            fetchMedicationsForPatient(patientId); // Fetch meds for the selected patient
        } else {
            setSelectedPatientName('');
            setMedications([]); // Clear meds if "Select Patient" is chosen
        }
    };

    // Format date for input type="date" (YYYY-MM-DD)
    const formatDateForInput = (dateString) => {
        if (!dateString) return '';
        try {
            return new Date(dateString).toISOString().split('T')[0];
        } catch (e) {
            return ''; // Return empty if date is invalid
        }
    };

    // Open Modal Handlers
    const handleAddClick = () => {
        setCurrentMedication(null); // Indicates Add mode
        setFormData({ // Reset form data
            name: '', dosage: '', frequency: 'Once daily', times: [''],
            startDate: '', endDate: '', notes: '', isActive: true,
        });
        setModalError('');
        setIsModalOpen(true);
    };

    const handleEditClick = (med) => {
        setCurrentMedication(med); // Set the med to be edited
        setFormData({ // Populate form with existing data
            name: med.name || '',
            dosage: med.dosage || '',
            frequency: med.frequency || 'Once daily',
            times: Array.isArray(med.times) && med.times.length > 0 ? [...med.times] : [''], // Handle empty/missing times
            startDate: formatDateForInput(med.startDate),
            endDate: formatDateForInput(med.endDate),
            notes: med.notes || '',
            isActive: med.isActive !== false, // Default to true if undefined/null
        });
        setModalError('');
        setIsModalOpen(true);
    };

    // Delete Handler
    const handleDeleteClick = async (medId) => {
        if (!window.confirm("Are you sure you want to delete this medication prescription?")) return;
        setError(''); // Clear general errors
        // Optionally set a specific loading state for the item
        try {
            await medicationService.deleteMedication(medId);
            // Refresh list after deletion
            fetchMedicationsForPatient(selectedPatientId);
            // Add success feedback (toast) if desired
        } catch (err) {
            setError(`Failed to delete medication: ${err.message || 'Server error'}`);
            console.error(err);
        }
    };

    // Modal Close Handler
    const handleCloseModal = () => {
        setIsModalOpen(false);
        setCurrentMedication(null); // Reset edit state
    };

    // Form Input Change Handler
    const handleFormChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
    };

    // Time Input Handlers (similar to patient version)
    const handleTimeChange = (index, value) => {
       const currentTimes = Array.isArray(formData.times) ? formData.times : [''];
        const updatedTimes = [...currentTimes];
        updatedTimes[index] = value;
        setFormData(prev => ({ ...prev, times: updatedTimes }));
    };
    const addTimeInput = () => {
        const currentTimes = Array.isArray(formData.times) ? formData.times : [];
        setFormData(prev => ({ ...prev, times: [...currentTimes, ""] }));
    };
    const removeTimeInput = (index) => {
        const currentTimes = Array.isArray(formData.times) ? formData.times : [''];
        const updatedTimes = currentTimes.filter((_, i) => i !== index);
        // Ensure at least one input remains if times are expected
        setFormData(prev => ({ ...prev, times: updatedTimes.length > 0 ? updatedTimes : [""] }));
    };

    // Form Submit Handler (Handles both Add and Edit)
    const handleFormSubmit = async (e) => {
        e.preventDefault();
        if (!selectedPatientId && !currentMedication) { // Need patientId for adding
             setModalError("Internal error: Patient context lost."); return;
        }
        setIsSubmitting(true);
        setModalError('');

        // Prepare data, filter empty times
        const submissionData = {
            ...formData,
            times: Array.isArray(formData.times) ? formData.times.filter(t => t && t.trim() !== "") : [],
            // Ensure dates are potentially valid - backend does final validation
            startDate: formData.startDate || null,
            endDate: formData.endDate || null,
        };

        try {
            if (currentMedication) { // Editing existing medication
                // Remove patientId if present, shouldn't update patient link via this
                const { patientId, ...updateData } = submissionData;
                await medicationService.updateMedication(currentMedication._id, updateData);
            } else { // Adding new medication
                // Ensure patientId is included for creation
                submissionData.patientId = selectedPatientId;
                await medicationService.createMedication(submissionData);
            }
            handleCloseModal();
            fetchMedicationsForPatient(selectedPatientId); // Refresh the list
        } catch (err) {
            setModalError(err.message || `Failed to ${currentMedication ? 'update' : 'add'} medication.`);
            console.error(err);
        } finally {
            setIsSubmitting(false);
        }
    };


    return (
        <div className="manage-meds-page">
            <h1>Manage Patient Medications</h1>

            {error && <p className="error-message">{error}</p>}

            <div className="patient-selector-container">
                <label htmlFor="patient-select">Select Patient:</label>
                <select
                    id="patient-select"
                    value={selectedPatientId}
                    onChange={handlePatientSelect}
                    disabled={isLoadingPatients}
                >
                    <option value="">-- Select a Patient --</option>
                    {isLoadingPatients ? (
                        <option disabled>Loading patients...</option>
                    ) : (
                        patients.map(p => (
                            <option key={p._id} value={p._id}>
                                {p.firstName} {p.lastName} ({p.email})
                            </option>
                        ))
                    )}
                </select>
            </div>

            {selectedPatientId && (
                <div className="medication-list-container">
                    <h2>Medications for {selectedPatientName}</h2>
                    <button onClick={handleAddClick} className="add-button">
                        + Prescribe New Medication
                    </button>

                    {isLoadingMedications ? (
                        <p>Loading medications...</p>
                    ) : medications.length === 0 ? (
                        <p>No medications prescribed for this patient yet.</p>
                    ) : (
                        <table className="medications-table">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Dosage</th>
                                    <th>Frequency</th>
                                    <th>Times</th>
                                    <th>Start Date</th>
                                    <th>End Date</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {medications.map(med => (
                                    <tr key={med._id}>
                                        <td>{med.name}</td>
                                        <td>{med.dosage}</td>
                                        <td>{med.frequency}</td>
                                        <td>{Array.isArray(med.times) ? med.times.join(', ') : ''}</td>
                                        <td>{formatDateForInput(med.startDate)}</td>
                                        <td>{formatDateForInput(med.endDate) || 'Ongoing'}</td>
                                        <td>{med.isActive !== false ? 'Active' : 'Inactive'}</td>
                                        <td>
                                            <button onClick={() => handleEditClick(med)} className="edit-button">Edit</button>
                                            <button onClick={() => handleDeleteClick(med._id)} className="delete-button">Delete</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            )}

            {/* --- Add/Edit Modal --- */}
            <Modal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                title={currentMedication ? 'Edit Medication Prescription' : 'Prescribe New Medication'}
            >
                <form onSubmit={handleFormSubmit} className="medication-form">
                     {/* Form fields are similar to patient tracking form, use formData state */}
                     {/* Name */}
                     <div className="form-group-manage">
                        <label>Name:</label>
                        <input type="text" name="name" value={formData.name || ''} onChange={handleFormChange} required />
                     </div>
                     {/* Dosage */}
                     <div className="form-group-manage">
                        <label>Dosage:</label>
                        <input type="text" name="dosage" value={formData.dosage || ''} onChange={handleFormChange} required />
                     </div>
                     {/* Frequency */}
                     <div className="form-group-manage">
                        <label>Frequency:</label>
                        <select name="frequency" value={formData.frequency || 'Once daily'} onChange={handleFormChange} required>
                             <option value="Once daily">Once daily</option>
                             <option value="Twice daily">Twice daily</option>
                             <option value="Three times daily">Three times daily</option>
                             <option value="As needed">As needed</option>
                             <option value="Other">Other (Specify in Notes)</option>
                             {/* Add more options */}
                        </select>
                     </div>
                     {/* Times */}
                     <div className="form-group-manage time-inputs-manage">
                       <label>Specific Times (HH:MM):</label>
                       {(formData.times || ['']).map((time, index) => (
                         <div key={index} className="time-input-row-manage">
                           <input type="time" value={time} onChange={(e) => handleTimeChange(index, e.target.value)} />
                           {(formData.times || []).length > 1 && (
                               <button type="button" onClick={() => removeTimeInput(index)} className="remove-time-btn-manage">-</button>
                           )}
                         </div>
                       ))}
                       <button type="button" onClick={addTimeInput} className="add-time-btn-manage">+ Add time</button>
                     </div>
                     {/* Start Date */}
                     <div className="form-group-manage">
                        <label>Start Date:</label>
                        <input type="date" name="startDate" value={formData.startDate || ''} onChange={handleFormChange} required />
                     </div>
                     {/* End Date */}
                     <div className="form-group-manage">
                        <label>End Date (Optional):</label>
                        <input type="date" name="endDate" value={formData.endDate || ''} onChange={handleFormChange} />
                     </div>
                     {/* isActive */}
                     <div className="form-group-manage form-group-check-manage">
                        <label htmlFor="isActiveCheckbox">Active Prescription:</label>
                        <input type="checkbox" id="isActiveCheckbox" name="isActive" checked={formData.isActive !== false} onChange={handleFormChange} />
                     </div>
                     {/* Notes */}
                     <div className="form-group-manage">
                        <label>Notes:</label>
                        <textarea name="notes" rows="3" value={formData.notes || ''} onChange={handleFormChange}></textarea>
                     </div>

                     {modalError && <p className="error-message">{modalError}</p>}

                     <div className="modal-actions-manage">
                        <button type="button" onClick={handleCloseModal} className="cancel-button">Cancel</button>
                        <button type="submit" disabled={isSubmitting} className="submit-button">
                            {isSubmitting ? 'Saving...' : (currentMedication ? 'Update Medication' : 'Add Medication')}
                        </button>
                     </div>
                </form>
            </Modal>

        </div>
    );
};

export default ManagePatientMedications;