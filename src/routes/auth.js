import express from 'express';
import authCtrl from '../controllers/authCtrl.js';

const authRouter = express.Router();

authRouter.post('/sign-up', (req, res) => {
    authCtrl.signUp(req, res);
})

authRouter.post('/log-in', (req, res) => {
    authCtrl.logIn(req, res);
})

authRouter.post('/log-out', (req, res) => {
    authCtrl.logOut(req, res);
})

export default authRouter;