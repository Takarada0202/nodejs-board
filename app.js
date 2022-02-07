const fs = require('fs')
const mysql = require('mysql')
const express = require('express')
const bodyParser = require('body-parser')
const path = require('path')

const session = require('express-session')
const crypto = require('crypto')
const FileStore = require('session-file-store')(session) 
const cookieParser = require('cookie-parser')
const bcrypt = require('bcryptjs')
const app = express()

const client = mysql.createConnection({
    user : 'root',
    password : '',
    database : 'nodejs'

})

app.use(express.static(path.join(__dirname,'/public')))

app.set('views', __dirname + '\\views')
app.set('view engine', 'ejs')

app.use(bodyParser.urlencoded({extended:false}))
app.use(bodyParser.json())

app.use(session({
    secret : 'taka',
    resave : false, 
    saveUninitialized : true, 
    store : new FileStore() 
}))

app.get('/', (req,res)=>{
    console.log('mainconn')
    console.log(req.session)
    if(req.session.is_logined == true){
        res.render('index', {
            is_logined : req.session.is_logined,
            name : req.session.name
        })
    }else{
        res.render('index',{
            
            is_logined : false
        })
    }
})

app.get('/register',(req,res)=>{
    console.log('회원가입 페이지')
    res.render('register')
})

app.post('/register',async (req,res)=>{
    console.log('회원가입 하는중')
    const body = req.body
    const id = body.id
    const password = body.password
    const name = body.name
    const email = body.email

    // let hashedPassword = bcrypt.hash(password, 8, (err, hashedPassword) => {
    //     console.log(hashedPassword);
    // })
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(password, salt)
    // let hashedPassword =await bcrypt.hash(password, 8)
    //     console.log(hashedPassword);

    
    
    client.query('select * from users where id=?',[id], (err,data)=>{
        if(data.length == 0){
            console.log('회원가입 성공')
            client.query('INSERT INTO users SET ?', {id : id, name: name, email: email, password: hashedPassword })
            res.redirect('/')
        }else{
            console.log('회원가입 실패')
            res.send('<script>alert("회원가입 실패")</script>')
            res.redirect('/login')
        }
    })
})



app.get('/login',(req,res)=>{
    console.log('로그인 작동')
    res.render('login')
})

app.post('/login', (req,res)=>{
    const body = req.body
    const id = body.id
    const password = body.password

    client.query('select * from users where id=?',[id],async (err,data)=>{
        const salt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(password, salt)
        console.log(data);
        
        // const check =  await bcrypt.compare(password, hashedPassword)

        const same = bcrypt.compareSync(password, data[0].password)
        console.log(same);
        console.log(password);
        console.log(data[0].password);
        // console.log(data[0])
        // console.log(id)
        // console.log(data[0].id)
        // console.log(data[0].password)
        // console.log(id == data[0].id)
        // console.log(password == data[0].password)
        if(id == data[0].id & bcrypt.compareSync(password, data[0].password) === true){
            console.log(data.id)
            console.log('로그인 성공')
            // console.log(hashedPassword);
            req.session.is_logined = true
            req.session.name = data.name
            req.session.id = data.id
            req.session.password = data.password
            req.session.save(function(){
                res.render('index',{
                    name : data[0].name,
                    id : data[0].id,
                    email : data[0].email,
                    is_logined : true
                })
            })
        }else{
            console.log('로그인 실패')
            console.log(data[0].id)
            res.render('login')
        }
    })
    
})

app.get('/logout',(req,res)=>{
    console.log('로그아웃 성공')
    req.session.destroy(function(err){
        res.redirect('/')
    })

})

app.get('/boardList', (req,res) => {
    res.render('boardList')
})




app.listen(3000, () => {
    console.log("conn")
})