import { validToken } from "../lib/auth.js";
export default function handler(req,res) { return res.status(200).json({authenticated:validToken(req)}); }
