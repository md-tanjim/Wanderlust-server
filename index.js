import express from 'express';
import { MongoClient, ObjectId } from 'mongodb';
import cors from 'cors';
import 'dotenv/config';
import { createRemoteJWKSet, jwtVerify } from 'jose';


const app = express();
const PORT = 5000; 


app.listen(PORT, ()=>{
    console.log("server is running at port", PORT );
});

//middle wire
app.use(cors());
app.use(express.json());


app.get('/', (req,res)=>{
    res.send("server is running gooood");
})


const client = new MongoClient(`mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ojmgvh3.mongodb.net/`);


export async function connecToMongodb(){
    try {
        await client.connect();
        console.log('successfully connected too mongodb');
        return client;

    } catch (error) {
        
    }
}

//Mnogodb Database(practice-1) and collection(usersCollection)  connection
const connectedClient = await connecToMongodb();
const db = connectedClient.db('wanderlust');
const destinationCollection = db.collection('destination');

const bookingCollection = db.collection('bookings');

const varifyToken = async(req,res,next)=>{
    const authHeader = req.headers.authorization;
    // console.log(authHeader);
    if  (!authHeader) {
        return res.status(401).send({msg : 'unauthorized'});
    }
    const token = authHeader.split(" ")[1];
    // console.log(Array.isArray(token), "token");
    // console.log(token, "token");

    if (!token) {
        return res.status(401).send({msg: 'umauthorized'});
    }


    const JWKS = createRemoteJWKSet(new URL(`${process.env.CLIENT_URL}/api/auth/jwks`))
    
    // console.log(payload, "payload");
    
    try {
        const {payload} = await jwtVerify(token, JWKS)
        next()
        
    } catch (error) {
    return res.status(500).send({msg: 'not varified'});
        
    }
     




}



app.post('/add-destination',varifyToken, async(req,res)=>{
    const data = req.body;
    const result = await destinationCollection.insertOne(data);

    console.log(result);
    res.send(result);
});

app.get('/all-destinations', async (req,res)=>{
    const results = await destinationCollection.find().toArray();
    res.send(results);
});


//edit dialog





app.patch('/all-destinations/:id',async(req,res)=>{
    const {id} = req.params;
   const updatedData = { ...req.body };
    delete updatedData._id;
    const result = await destinationCollection.updateOne(
    {_id : new ObjectId(id)},
    {$set: updatedData}
    )

    res.json(result);
})


// details destinations
app.get('/all-destinations/:id',varifyToken,async(req,res)=>{
    const {id} = req.params;
    console.log(id);
    
    const result = await destinationCollection.findOne({_id : new ObjectId(id)})
    
    console.log(result);

    res.send(result); 
})

// posting booking datas

app.post('/booking', async(req,res)=>{
    const data = req.body;
    delete data._id;
    const result = await bookingCollection.insertOne(data);
    res.send(result);

})


//my bookings
app.get('/my-bookings/:email',async(req,res)=>{
    const {email} = req.params;
// const result = await bookingCollection.find({name_in_the_database : coming_from_params}).toArray();
    const result = await bookingCollection.find({userEmail : email}).toArray();
    console.log(req.params);
    res.send(result);

})

//my booking card delete

app.delete('/my-bookings/:id', async(req,res)=>{
    const {id} = req.params;
    const result = await bookingCollection.deleteOne({_id : new ObjectId(id)});
    res.send(result);

})










