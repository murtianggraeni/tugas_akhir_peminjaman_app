const axios = require("axios");
const fs = require("fs");
const app = require('../index');

describe('API Testing', () => {
    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2Njg1ODJkNmI5M2JiYTAyYzA4ODAwNTMiLCJ1c2VyTmFtZSI6IkFkbWluIiwiZW1haWxJZCI6ImFkbWluQGdtYWlsLmNvbSIsInVzZXJSb2xlIjoiYWRtaW4iLCJpYXQiOjE3MjQ5Mjg4Nzl9.93ZkHxPTnJgPp_KHjw6xz-gVwoP8R9zDs4fJIz1Ko38';
    const machineTypes = ['cnc', 'laser', 'printing'];
  
    machineTypes.forEach(type => {
      describe(`${type.toUpperCase()} Routes`, () => {
        test(`GET /${type}/monitoring`, async () => {
          const response = await request(app)
            .get(`/${type}/monitoring`)
            .set('Authorization', `Bearer ${token}`);
          expect(response.status).toBe(200);
        });
  
        test(`GET /${type}`, async () => {
          const response = await request(app)
            .get(`/${type}`)
            .set('Authorization', `Bearer ${token}`);
          expect(response.status).toBe(200);
        });
  
        test(`GET /${type}/:id`, async () => {
          const response = await request(app)
            .get(`/${type}/123`)
            .set('Authorization', `Bearer ${token}`);
          expect(response.status).toBe(200);
        });
  
        test(`PUT /${type}/:id/disetujui`, async () => {
          const response = await request(app)
            .put(`/${type}/123/disetujui`)
            .set('Authorization', `Bearer ${token}`)
            .send({
              status: 'disetujui',
              keterangan: 'Test disetujui'
            });
          expect(response.status).toBe(200);
        });
  
        test(`PUT /${type}/:id/ditolak`, async () => {
          const response = await request(app)
            .put(`/${type}/123/ditolak`)
            .set('Authorization', `Bearer ${token}`)
            .send({
              status: 'ditolak',
              keterangan: 'Test ditolak'
            });
          expect(response.status).toBe(200);
        });
  
        test(`DELETE /${type}/:id`, async () => {
          const response = await request(app)
            .delete(`/${type}/123`)
            .set('Authorization', `Bearer ${token}`);
          expect(response.status).toBe(200);
        });
      });
    });
  
    describe('Approved Peminjaman Routes', () => {
      test('GET /approved-peminjaman', async () => {
        const response = await request(app)
          .get('/approved-peminjaman')
          .set('Authorization', `Bearer ${token}`);
        expect(response.status).toBe(200);
      });
  
      test('GET /approved-peminjaman/:date', async () => {
        const response = await request(app)
          .get('/approved-peminjaman/2024-03-21')
          .set('Authorization', `Bearer ${token}`);
        expect(response.status).toBe(200);
      });
    });
  });


