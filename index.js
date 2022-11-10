const express = require("express");
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const app = express();
const port = process.env.PORT || 5000;

// middle wares
app.use(cors());
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.ktnfrsc.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

function verifyJWT(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        res.status(401).send({ message: 'Unauthorized Access' })
    }
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
        if (err) {
            res.status(403).send({ message: 'Forbidden Access' })
        }
        req.decoded = decoded;
        next()
    })
}

async function run() {
    try {
        const serviceCollection = client.db('goingGlobal').collection('services');
        const reviewCollection = client.db('goingGlobal').collection('reviews');
        // jwt token
        app.post('/jwt', (req, res) => {
            const user = req.body;
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '10h' })
            res.send({ token });
        })

        // get limit services from database 
        app.get('/services', async (req, res) => {
            const query = {};
            const sort = { "time": -1 }
            const cursor = serviceCollection.find(query).sort(sort);
            const services = await cursor.limit(3).toArray();
            res.send(services);
        })
        // get all services from database 
        app.get('/allServices', async (req, res) => {
            const query = {};
            const cursor = serviceCollection.find(query);
            const services = await cursor.toArray()
            res.send(services);
        })
        // get single data or services from database 
        app.get('/allServices/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const service = await serviceCollection.findOne(query);
            res.send(service);
        })

        // add services in database
        app.post('/services', verifyJWT, async (req, res) => {
            const service = req.body;
            const result = await serviceCollection.insertOne(service);
            res.send(result)
        })

        // review api get
        app.get('/reviews', verifyJWT, async (req, res) => {
            const decoded = req.decoded;
            if (decoded.email !== req.query.email) {
                res.status(401).send({ message: 'Unauthorized Access' })
            }
            let query = {};
            if (req.query.email) {
                query = {
                    email: req.query.email
                }
            }
            const sort = { "date": -1 }
            const cursor = reviewCollection.find(query).sort(sort);
            const reviews = await cursor.toArray();
            res.send(reviews);
        })

        // review api
        app.post('/reviews', async (req, res) => {
            const review = req.body;
            const result = await reviewCollection.insertOne(review);
            res.send(result);
        })

        // review single data get for update api 
        app.get('/reviews/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const review = await reviewCollection.findOne(query);
            res.send(review);
        })
        // review single data put for update api
        app.put('/reviews/:id', verifyJWT, async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) };
            const review = req.body;
            const option = { upsert: true };
            const updatedReview = {
                $set: {
                    serviceName: review.serviceName,
                    name: review.name,
                    reviewDesc: review.reviewDesc,
                    userRating: review.userRating,
                    email: review.email,
                    phone: review.phone,
                    date: review.date
                }
            }
            const result = await reviewCollection.updateOne(filter, updatedReview, option);
            res.send(result);
        })

        // review Delete
        app.delete('/reviews/:id', verifyJWT, async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await reviewCollection.deleteOne(query);
            res.send(result);
        })
    }
    finally {

    }
}
run().catch(err => console.error(err));



app.get('/', (req, res) => {
    res.send('Going Global server in Running')
});

app.listen(port, () => {
    console.log(`Going Global server is running on ${port}`)
})
