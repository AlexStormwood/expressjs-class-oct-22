const mongoose = require("mongoose");
const request = require('supertest');
const {app} = require('../src/server');
const { databaseConnector,databaseDisconnector } = require('../src/database');
const DATABASE_URI = process.env.DATABASE_TEST_URI || 'mongodb://localhost:27017/octTestoTestMode';

// Establish a fresh database connection before each test suite runs
beforeEach(async () => {
    await databaseConnector(DATABASE_URI);
});

// Cleanly close the database connection after each test is done
// so that test CI/automation tools can exit properly.
afterEach(async () => {
    await databaseDisconnector();
});

describe('Server homepage...', () => {
    it('shows a Hello message.', async () => {
        const response = await request(app).get('/');
        expect(response.statusCode).toEqual(200);
		expect(response.text).toEqual(expect.stringContaining("Hello"));

    });
});