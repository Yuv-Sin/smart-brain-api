const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt-nodejs');
const cors = require('cors');
const knex = require('knex');

const db = knex({
  client: 'pg',
  connection: {
    connectionString : process.env.DATABASE_URL,
    ssl: true
  }
});

db.select('*').from('users').then(data => {
	console.log(data);
});

app.use(bodyParser.json());
app.use(cors());

app.get('/',(req,res)=> {
	res.send('it is working');
});


app.post('/signin',(req,res)=>{
	const { email, password, name } = req.body;
	if(!email || !password){

		alert("Please enter Credentials");
		return res.status(400).json('Values Not Entered')
		
	}
	db.select('email', 'hash').from('login')
	.where('email', '=', email)
	.then(data =>{

		const isValid = bcrypt.compareSync(password, data[0].hash);
		if(isValid){
			return db.select('*').from('users')
			.where('email', '=', email)
			.then(user => {
				res.json(user[0])
			})
			.catch(err => res.status(400).json('Unable to get user'))
		} else{
			res.status(400).json('wrong credentials')
		}
	})
	.catch(err => res.status(400).json('Wrong Credentials'))
});

app.post('/register',(req,res) =>{
	const { email, name, password } = req.body;
	if(!email || !password || !name){

		alert("Please enter Credentials");
		return res.status(400).json('Values Not Entered')
		
	}
	
	const hash = bcrypt.hashSync(password);
	db.transaction(trx =>{
		trx.insert({
			hash: hash,
			email: email
		})
		.into('login')
		.returning('email')
		.then(loginEmail =>{
			return trx('users')
			.returning('*')
			.insert({
				email: loginEmail[0],
				name: name,
				joined: new Date()
			}).then(user => {
				res.json(user[0])
			})
			})

			.then(trx.commit)
			.catch(trx.rollback)
	})
		
		.catch(err => res.status(400).json('Unable To Register'))
	
});

app.get('/profile/:id',(req,res) => {
	const { id } = req.params;
	db.select('*').from('users').where({id}).then(user =>{
		
		if(user.length){
			res.json(user[0]);
		}
		else{
			res.status(400).json('not found')
		}
	})
	.catch(err =>{
		res.status(400).json('error getting user')
	})
	

});

app.put('/image',(req,res) => {

	const { id } =req.body;
	db('users').where('id', '=', id )
	.increment('entries', 1)
	.returning('entries')
	.then(entries => {
		res.json(entries[0])
	})
	.catch(err => res.status(400).json('unable to get entries'))
	
})

app.listen(process.env.PORT || 3002,()=>{
	console.log(`app running on port ${ process.env.PORT }`);
});