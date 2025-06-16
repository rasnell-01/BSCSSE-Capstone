const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const router = require('../router');
const Item = require('../models/Item');

let app;
let mongoServer;

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();

    await mongoose.connect(uri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    });

    app = express();
    app.use(express.json());
    app.use('/api/items', router);
});

afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    await mongoServer.stop();
});

afterEach(async () => {
    await Item.deleteMany({});
});

describe('Item API extended', () => {
    let createdItem;

    beforeEach(async () => {
        createdItem = await Item.create({ name: 'Test Item', quantity: 1 });
    });

    it('should update an item', async () => {
        const res = await request(app)
            .put(`/api/items/${createdItem._id}`)
            .send({ name: 'Updated Item', quantity: 3 });

        expect(res.statusCode).toBe(200);
        expect(res.body.name).toBe('Updated Item');
        expect(res.body.quantity).toBe(3);
    });

    it('should return 404 for updating non-existent item', async () => {
        const fakeId = new mongoose.Types.ObjectId();
        const res = await request(app)
            .put(`/api/items/${fakeId}`)
            .send({ name: 'Nope', quantity: 1 });

        expect(res.statusCode).toBe(404);
    });

    it('should delete an item', async () => {
        const res = await request(app).delete(`/api/items/${createdItem._id}`);
        expect(res.statusCode).toBe(200);
        expect(res.body.message).toMatch(/deleted/i);
    });

    it('should return 404 for deleting non-existent item', async () => {
        const fakeId = new mongoose.Types.ObjectId();
        const res = await request(app).delete(`/api/items/${fakeId}`);
        expect(res.statusCode).toBe(404);
    });

    it('should return validation error for missing name', async () => {
        const res = await request(app)
            .post('/api/items')
            .send({ quantity: 5 });

        expect(res.statusCode).toBe(400);
        expect(res.body.errors).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ msg: 'Name is required' }),
            ])
        );
    });

    it('should return validation error for invalid quantity', async () => {
        const res = await request(app)
            .post('/api/items')
            .send({ name: 'Bad Quantity', quantity: -2 });

        expect(res.statusCode).toBe(400);
        expect(res.body.errors).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    msg: 'Quantity must be a non-negative integer',
                }),
            ])
        );
    });
});
