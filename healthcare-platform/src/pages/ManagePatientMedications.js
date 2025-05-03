import React, { useState, useEffect, useCallback } from 'react';
// Services
import { getPatientsList } from '../services/consultantService';
import * as medicationService from '../services/medicationService';
import * as medicationLogService from '../services/medicationLogService';
// Components
import Modal from '../components/Modal'; 
// Styles
import './styles/ManagePatientMedications.css';

// Days of the week constant
const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// Helper to get date string YYYY-MM-DD
const getDateString = (date) => {
    if (!date) return '';
    try { const d = new Date(date); const offset = d.getTimezoneOffset(); const adjustedDate = new Date(d.getTime() - (offset*60*1000)); return adjustedDate.toISOString().split('T')[0]; } catch (e) { return ''; }
};

// Helper to format date/time display
const formatDateTimeDisplay = (dateString) => {
    if (!dateString) return 'N/A';
    try { return new Date(dateString).toLocaleString(undefined, {dateStyle: 'short', timeStyle: 'short'}); } catch (e) { return 'Invalid Date'; }
};

const ManagePatientMedications = () => {
    // --- State Declarations ---
    const [patients, setPatients] = useState([]);
    const [selectedPatientId, setSelectedPatientId] = useState('');
    const [selectedPatientName, setSelectedPatientName] = useState('');
    const [medications, setMedications] = useState([]);
    const [isLoadingPatients, setIsLoadingPatients] = useState(false);
    const [isLoadingMedications, setIsLoadingMedications] = useState(false);
    const [error, setError] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false); // State for modal visibility
    const [currentMedication, setCurrentMedication] = useState(null); // null = Add, object = Edit
    const initialFormData = { name: '', dosage: '', frequencyType: 'daily', frequencyValue: 1, daysOfWeek: [], times: [''], startDate: '', endDate: '', notes: '', isActive: true };
    const [formData, setFormData] = useState(initialFormData);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [modalError, setModalError] = useState('');
    const [logStartDate, setLogStartDate] = useState(() => { const date = new Date(); date.setDate(date.getDate() - 6); return getDateString(date); });
    const [logEndDate, setLogEndDate] = useState(getDateString(new Date()));
    const [patientLogs, setPatientLogs] = useState([]);
    const [isLoadingLogs, setIsLoadingLogs] = useState(false);
    const [errorLogs, setErrorLogs] = useState('');

    // --- Effects and Callbacks ---
    // Fetch patient list
    const fetchPatients = useCallback(async () => { setIsLoadingPatients(true); setError(''); try { const data = await getPatientsList(); setPatients(Array.isArray(data) ? data : []); } catch (err) { setError('Failed to load patients.'); console.error(err); setPatients([]); } finally { setIsLoadingPatients(false); }}, []);
    useEffect(() => { fetchPatients(); }, [fetchPatients]); // Run once on mount

    // Fetch medications for selected patient
    const fetchMedicationsForPatient = useCallback(async (patientId) => { if (!patientId) { setMedications([]); return; } setIsLoadingMedications(true); setError(''); try { const data = await medicationService.getMedications(patientId); setMedications(Array.isArray(data) ? data : []); } catch (err) { setError(`Failed to load medications.`); console.error(err); setMedications([]); } finally { setIsLoadingMedications(false); }}, []);

    // Fetch adherence logs
    const fetchPatientLogs = useCallback(async (patientId, startDate, endDate) => { if (!patientId || !startDate || !endDate) { setPatientLogs([]); return; } setIsLoadingLogs(true); setErrorLogs(''); setPatientLogs([]); try { const data = await medicationLogService.getPatientLogsByRange(patientId, startDate, endDate); setPatientLogs(Array.isArray(data) ? data : []); } catch (err) { setErrorLogs(err.message || 'Failed to load logs.'); console.error(err); setPatientLogs([]); } finally { setIsLoadingLogs(false); }}, []);

    // --- Event Handlers ---
    // Handle patient selection
    const handlePatientSelect = (e) => {
        const patientId = e.target.value; setSelectedPatientId(patientId);
        setMedications([]); setPatientLogs([]); setErrorLogs(''); setError('');
        if (patientId && Array.isArray(patients)) {
            const patient = patients.find(p => p._id === patientId);
            setSelectedPatientName(patient ? `${patient.firstName} ${patient.lastName}` : '');
            fetchMedicationsForPatient(patientId); fetchPatientLogs(patientId, logStartDate, logEndDate);
        } else { setSelectedPatientName(''); }
    };

    // Format date for input fields
    const formatDateForInput = (dateString) => { if (!dateString) return ''; try { return getDateString(dateString); } catch (e) { return ''; } };

    // Open Add Modal
    const handleAddClick = () => {
        console.log('handleAddClick triggered - Setting modal open'); // Add log *before* setting state
        setCurrentMedication(null); setFormData(initialFormData);
        setModalError('');
        setIsModalOpen(true); // Explicitly setting state to true
    };

    // Open Edit Modal
    const handleEditClick = (med) => {
        console.log('handleEditClick triggered - Setting modal open for med:', med?._id); // Add log *before* setting state
        if (!med) return; // Safety check
        setCurrentMedication(med);
        setFormData({ name: med.name || '', dosage: med.dosage || '', frequencyType: med.frequencyType || 'daily', frequencyValue: med.frequencyValue ?? (med.frequencyType === 'daily' ? 1 : ''), daysOfWeek: Array.isArray(med.daysOfWeek) ? [...med.daysOfWeek] : [], times: Array.isArray(med.times) && med.times.length > 0 ? [...med.times] : [''], startDate: formatDateForInput(med.startDate), endDate: formatDateForInput(med.endDate), notes: med.notes || '', isActive: med.isActive !== false, });
        setModalError('');
        setIsModalOpen(true); // Explicitly setting state to true
    };

    // Delete Medication
    const handleDeleteClick = async (medId) => {
        console.log('handleDeleteClick triggered for medId:', medId);
        // Confirmation dialog should appear here
        if (!window.confirm("Are you sure you want to delete this prescription?")) {
             console.log('Delete cancelled by user.');
             return;
        }
        setError('');
        console.log('Attempting to delete medication...');
        try {
            await medicationService.deleteMedication(medId);
            console.log('Medication deleted successfully via service.');
            fetchMedicationsForPatient(selectedPatientId); // Refresh the list
        } catch (err) {
             console.error('Error during handleDeleteClick:', err);
             setError(`Delete failed: ${err.message || 'Server error'}`);
        }
    };

    // Modal Close
    const handleCloseModal = () => { console.log("handleCloseModal triggered"); setIsModalOpen(false); setCurrentMedication(null); };

    // Form Input Change
    const handleFormChange = (e) => { const { name, value, type, checked } = e.target; const val = name === 'frequencyValue' ? parseInt(value, 10) || '' : value; setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : val, })); if (name === 'frequencyType') { setFormData(prev => ({ ...prev, frequencyValue: value === 'daily' ? 1 : '', daysOfWeek: [], [name]: value })); } };
    const handleDayOfWeekChange = (e) => { const { value, checked } = e.target; setFormData(prev => { const currentDays = Array.isArray(prev.daysOfWeek) ? prev.daysOfWeek : []; if (checked) { return { ...prev, daysOfWeek: [...currentDays, value].filter((v, i, a) => a.indexOf(v) === i) }; } else { return { ...prev, daysOfWeek: currentDays.filter(day => day !== value) }; } }); };
    const handleTimeChange = (index, value) => { const currentTimes = Array.isArray(formData.times) ? formData.times : ['']; const updatedTimes = [...currentTimes]; updatedTimes[index] = value; setFormData(prev => ({ ...prev, times: updatedTimes })); };
    const addTimeInput = () => { const currentTimes = Array.isArray(formData.times) ? formData.times : []; setFormData(prev => ({ ...prev, times: [...currentTimes, ""] })); };
    const removeTimeInput = (index) => { const currentTimes = Array.isArray(formData.times) ? formData.times : ['']; const updatedTimes = currentTimes.filter((_, i) => i !== index); setFormData(prev => ({ ...prev, times: updatedTimes.length > 0 ? updatedTimes : [""] })); };

    // Form Submit
    const handleFormSubmit = async (e) => { e.preventDefault(); if (!selectedPatientId && !currentMedication) { setModalError("Patient context lost."); return; } setIsSubmitting(true); setModalError(''); const submissionData = { name: formData.name, dosage: formData.dosage, frequencyType: formData.frequencyType, ...( (formData.frequencyType === 'daily' && formData.frequencyValue > 1) || formData.frequencyType === 'interval_hours' ) && { frequencyValue: formData.frequencyValue }, ...( (formData.frequencyType === 'weekly' || formData.frequencyType === 'specific_days') && Array.isArray(formData.daysOfWeek) && formData.daysOfWeek.length > 0 ) && { daysOfWeek: formData.daysOfWeek }, times: Array.isArray(formData.times) ? formData.times.filter(t => t && t.trim() !== "") : [], startDate: formData.startDate || null, endDate: formData.endDate || null, notes: formData.notes, isActive: formData.isActive, }; if (submissionData.frequencyType === 'interval_hours' && (!submissionData.frequencyValue || submissionData.frequencyValue < 1)) { setModalError("Valid hour interval required."); setIsSubmitting(false); return; } if (submissionData.frequencyType === 'weekly' && (!submissionData.daysOfWeek || submissionData.daysOfWeek.length === 0)) { setModalError("Select at least one day for weekly."); setIsSubmitting(false); return; } try { if (currentMedication) { await medicationService.updateMedication(currentMedication._id, submissionData); } else { submissionData.patientId = selectedPatientId; await medicationService.createMedication(submissionData); } handleCloseModal(); fetchMedicationsForPatient(selectedPatientId); } catch (err) { const backendErrorMessage = err?.response?.data?.message || err.message; setModalError(backendErrorMessage || `Failed operation.`); console.error(err); } finally { setIsSubmitting(false); } };

    // Display Frequency Helper
    const displayFrequency = (med) => { switch(med?.frequencyType) { case 'daily': return `Daily${med.frequencyValue > 1 ? ` (every ${med.frequencyValue} days)` : ''}`; case 'weekly': return `Weekly (${(Array.isArray(med.daysOfWeek) ? med.daysOfWeek.join(', ') : '') || 'No days'})`; case 'interval_hours': return `Every ${med.frequencyValue || '?'} hours`; case 'as_needed': return 'As Needed'; case 'specific_days': return `Specific Days (${(Array.isArray(med.daysOfWeek) ? med.daysOfWeek.join(', ') : '') || 'No days'})`; default: return med?.frequencyType || 'Unknown'; } };

    // --- JSX Rendering ---
    return (
        <div className="manage-meds-page">
            <h1>Manage Patient Medications</h1>
            {error && <p className="error-message">{error}</p>}
            {/* --- Patient Selector --- */}
            <div className="patient-selector-container">
                <label htmlFor="patient-select">Select Patient:</label>
                <select id="patient-select" value={selectedPatientId} onChange={handlePatientSelect} disabled={isLoadingPatients}>
                    <option value="">-- Select a Patient --</option>
                    {isLoadingPatients ? ( <option disabled>Loading...</option> )
                     : Array.isArray(patients) && patients.length > 0 ? (
                          patients.map(p => ( <option key={p._id} value={p._id}> {p.firstName} {p.lastName} ({p.email}) </option> ))
                       ) : ( <option disabled>No patients found</option> )
                    }
                </select>
            </div>

            {selectedPatientId && (
                <>
                    {/* --- Medication List --- */}
                    <div className="medication-list-container">
                        <h2>Medications for {selectedPatientName}</h2>
                         {/* Ensure onClick is directly calling the handler */}
                        <button onClick={handleAddClick} className="add-button">+ Prescribe New Medication</button>
                        {isLoadingMedications ? ( <p>Loading medications...</p> )
                         : !Array.isArray(medications) || medications.length === 0 ? ( <p>No medications prescribed yet.</p> )
                         : (
                            <table className="medications-table">
                               <thead><tr><th>Name</th><th>Dosage</th><th>Frequency Details</th><th>Times</th><th>Start Date</th><th>End Date</th><th>Status</th><th>Actions</th></tr></thead>
                               <tbody>
                                   {medications.map(med => (
                                       <tr key={med._id}>
                                           <td>{med.name}</td><td>{med.dosage}</td><td>{displayFrequency(med)}</td><td>{Array.isArray(med.times) ? med.times.join(', ') : ''}</td><td>{formatDateForInput(med.startDate)}</td><td>{formatDateForInput(med.endDate) || 'Ongoing'}</td><td>{med.isActive !== false ? 'Active' : 'Inactive'}</td>
                                           <td>
                                                {/* Ensure onClick uses arrow function to pass arg */}
                                                {/* Added inline log to double-check click registration */}
                                               <button onClick={() => { console.log('Inline Edit Click on Button'); handleEditClick(med); }} className="edit-button">Edit</button>
                                               <button onClick={() => { console.log('Inline Delete Click on Button'); handleDeleteClick(med._id); }} className="delete-button">Delete</button>
                                           </td>
                                       </tr>
                                   ))}
                               </tbody>
                            </table>
                         )}
                    </div>

                    {/* --- Adherence Log Section --- */}
                    <div className="adherence-log-container">
                        <h2>Adherence Log for {selectedPatientName}</h2>
                        <div className="log-date-range-selector">
                            <div className="form-group-manage"><label htmlFor="logStartDate">From:</label><input type="date" id="logStartDate" value={logStartDate} onChange={(e) => setLogStartDate(e.target.value)} max={logEndDate} /></div>
                            <div className="form-group-manage"><label htmlFor="logEndDate">To:</label><input type="date" id="logEndDate" value={logEndDate} onChange={(e) => setLogEndDate(e.target.value)} min={logStartDate} max={getDateString(new Date())} /></div>
                            <button onClick={() => fetchPatientLogs(selectedPatientId, logStartDate, logEndDate)} disabled={isLoadingLogs || !logStartDate || !logEndDate} className="fetch-logs-button">{isLoadingLogs ? 'Fetching...' : 'Fetch Logs'}</button>
                        </div>
                        {errorLogs && <p className="error-message">{errorLogs}</p>}
                        {isLoadingLogs ? ( <p>Loading logs...</p> )
                          : !Array.isArray(patientLogs) || patientLogs.length === 0 ? ( <p>No logs found for this period.</p> )
                          : ( <table className="logs-table">
                                <thead><tr><th>Medication</th><th>Scheduled Date</th><th>Scheduled Time</th><th>Logged At</th></tr></thead>
                                <tbody>{patientLogs.map(log => ( <tr key={log._id || log.scheduleItemId}><td>{log.medication?.name ? `${log.medication.name} (${log.medication.dosage || 'N/A'})` : (log.medication || 'N/A')}</td><td>{formatDateForInput(log.scheduledDate)}</td><td>{log.scheduledTime}</td><td>{formatDateTimeDisplay(log.takenAt)}</td></tr> ))}</tbody>
                              </table> )}
                    </div>
                </>
            )}

             {/* --- Add/Edit Modal --- */}
             {/* Ensure isOpen prop is correctly passed */}
            <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={currentMedication ? 'Edit Medication' : 'Prescribe New Medication'}>
                 {/* Ensure form is rendered as child */}
                <form onSubmit={handleFormSubmit} className="medication-form">
                     <div className="form-group-manage"><label>Name:</label><input type="text" name="name" value={formData.name || ''} onChange={handleFormChange} required /></div>
                     <div className="form-group-manage"><label>Dosage:</label><input type="text" name="dosage" value={formData.dosage || ''} onChange={handleFormChange} required /></div>
                     <div className="form-group-manage"><label>Frequency Type:</label><select name="frequencyType" value={formData.frequencyType || 'daily'} onChange={handleFormChange} required><option value="daily">Daily</option><option value="weekly">Weekly</option><option value="interval_hours">Interval (Hours)</option><option value="as_needed">As Needed</option><option value="specific_days">Specific Days</option></select></div>
                     {(formData.frequencyType === 'daily' || formData.frequencyType === 'interval_hours') && (<div className="form-group-manage"><label>{formData.frequencyType === 'daily' ? 'Take every X days (1 = every day):' : 'Take every X hours:'}</label><input type="number" name="frequencyValue" value={formData.frequencyValue ?? ''} min="1" onChange={handleFormChange} required={formData.frequencyType === 'interval_hours'} /></div>)}
                     {(formData.frequencyType === 'weekly' || formData.frequencyType === 'specific_days') && (<div className="form-group-manage"><label>Select Days:</label><div className="days-checkbox-group">{DAYS_OF_WEEK.map(day => (<label key={day} className="day-checkbox-label"><input type="checkbox" value={day} checked={(formData.daysOfWeek || []).includes(day)} onChange={handleDayOfWeekChange} /> {day.substring(0,3)}</label>))}</div></div>)}
                     {formData.frequencyType !== 'as_needed' && (<div className="form-group-manage time-inputs-manage"><label>Specific Times (HH:MM):</label>{(formData.times || ['']).map((time, index) => ( <div key={index} className="time-input-row-manage"><input type="time" value={time} onChange={(e) => handleTimeChange(index, e.target.value)} />{(formData.times || []).length > 1 && (<button type="button" onClick={() => removeTimeInput(index)} className="remove-time-btn-manage">-</button>)}</div> ))}<button type="button" onClick={addTimeInput} className="add-time-btn-manage">+ Add time</button></div>)}
                     <div className="form-group-manage"><label>Start Date:</label><input type="date" name="startDate" value={formData.startDate || ''} onChange={handleFormChange} required /></div>
                     <div className="form-group-manage"><label>End Date (Optional):</label><input type="date" name="endDate" value={formData.endDate || ''} onChange={handleFormChange} /></div>
                     <div className="form-group-manage form-group-check-manage"><label htmlFor="isActiveCheckbox">Active:</label><input type="checkbox" id="isActiveCheckbox" name="isActive" checked={formData.isActive !== false} onChange={handleFormChange} /></div>
                     <div className="form-group-manage"><label>Notes:</label><textarea name="notes" rows="3" value={formData.notes || ''} onChange={handleFormChange}></textarea></div>
                     {modalError && <p className="error-message">{modalError}</p>}
                     <div className="modal-actions-manage"><button type="button" onClick={handleCloseModal} className="cancel-button">Cancel</button><button type="submit" disabled={isSubmitting} className="submit-button">{isSubmitting ? 'Saving...' : (currentMedication ? 'Update Medication' : 'Add Medication')}</button></div>
                </form>
            </Modal>
            {/* End of Modal */}
        </div>
    );
};

export default ManagePatientMedications;