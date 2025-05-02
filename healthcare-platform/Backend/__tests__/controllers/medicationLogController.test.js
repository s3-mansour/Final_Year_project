// Backend/__tests__/controllers/medicationLogController.test.js
const httpMocks = require('node-mocks-http');
jest.mock('../../models/MedicationLog');
jest.mock('../../models/Medication');

const MedicationLog = require('../../models/MedicationLog');
const Medication = require('../../models/Medication');
const mongoose = require('mongoose');

const {
  logDose,
  getLogsForDate,
  getLogsForPatientByDateRange,
} = require('../../controllers/medicationLogController');
// controller logic: logDose, getLogsForDate, getLogsForPatientByDateRange :contentReference[oaicite:2]{index=2}

describe('medicationLogController', () => {
  let req, res;

  beforeEach(() => {
    req = httpMocks.createRequest();
    res = httpMocks.createResponse();
    jest.clearAllMocks();
    mongoose.Types.ObjectId.isValid = jest.fn();
  });

  describe('logDose', () => {
    it('400 on missing fields', async () => {
      req.user = { _id: 'p1' };
      req.body = {};
      await expect(logDose(req, res))
        .rejects.toThrow('Missing required fields');
      expect(res.statusCode).toBe(400);
    });

    it('200 + existing log if already logged', async () => {
      const fakeLog = { _id: 'l1' };
      req.user = { _id: 'p1' };
      req.body = { scheduleItemId: 's1', scheduledDate: '2025-05-01', scheduledTime: '10:00' };
      MedicationLog.findOne.mockResolvedValue(fakeLog);

      await logDose(req, res);

      expect(res.statusCode).toBe(200);
      expect(JSON.parse(res._getData()))
        .toEqual({ message: 'Dose already logged.', log: fakeLog });
    });

    it('201 + new log when none exists', async () => {
      const newLog = { _id: 'l2' };
      req.user = { _id: 'p1' };
      req.body = { scheduleItemId: 's2', scheduledDate: '2025-05-02', scheduledTime: '11:00' };
      MedicationLog.findOne.mockResolvedValue(null);
      MedicationLog.create.mockResolvedValue(newLog);

      await logDose(req, res);

      expect(res.statusCode).toBe(201);
      expect(JSON.parse(res._getData()))
        .toEqual({ message: 'Dose logged successfully.', log: newLog });
    });
  });

  describe('getLogsForDate', () => {
    it('400 on invalid/missing date', async () => {
      req.user = { _id: 'p1' };
      req.query = {};
      await expect(getLogsForDate(req, res))
        .rejects.toThrow('Invalid or missing date query parameter');
      expect(res.statusCode).toBe(400);
    });

    it('200 + logs for valid date', async () => {
      const fakeLogs = [{ scheduleItemId: 's1' }];
      req.user = { _id: 'p1' };
      req.query = { date: '2025-05-02' };
      MedicationLog.find.mockReturnValue({
        select: () => Promise.resolve(fakeLogs)
      });

      await getLogsForDate(req, res);

      expect(res.statusCode).toBe(200);
      expect(JSON.parse(res._getData())).toEqual(fakeLogs);
      expect(MedicationLog.find).toHaveBeenCalledWith(expect.objectContaining({
        patient: 'p1'
      }));
    });
  });

  describe('getLogsForPatientByDateRange', () => {
    it('400 on invalid patientId format', async () => {
      req.user = { role: 'doctor', email: 'd@e.com' };
      req.params = { patientId: 'bad' };
      req.query = { startDate: '2025-05-01', endDate: '2025-05-03' };
      mongoose.Types.ObjectId.isValid.mockReturnValue(false);

      await expect(getLogsForPatientByDateRange(req, res))
        .rejects.toThrow('Invalid Patient ID format.');
      expect(res.statusCode).toBe(400);
    });

    it('200 + logs for valid range', async () => {
      const fakeLogs = [{ scheduleItemId: 's1' }];
      req.user = { role: 'doctor', email: 'd@e.com' };
      req.params = { patientId: 'p1' };
      req.query = { startDate: '2025-05-01', endDate: '2025-05-03' };
      mongoose.Types.ObjectId.isValid.mockReturnValue(true);

      const chain = {
        populate: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnValue(Promise.resolve(fakeLogs))
      };
      MedicationLog.find.mockReturnValue(chain);

      await getLogsForPatientByDateRange(req, res);

      expect(res.statusCode).toBe(200);
      expect(JSON.parse(res._getData())).toEqual(fakeLogs);
    });
  });
});
