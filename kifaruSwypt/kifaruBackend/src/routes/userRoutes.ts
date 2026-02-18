import { Router } from "express";
import { AddProduct, deleteProduct, getProducts, getProductsByMerchantID, getWalletById, savewallet, signupUser, updateProduct } from "../controllers/userController";
import { loginUser } from "../auth/authLogin";
import { verifyToken } from "../middlewares/VerifyToken";


const router = Router();

const asyncHandler = (fn: any) => (req: any, res: any, next: any) => {
	Promise.resolve(fn(req, res, next)).catch(next);
};


router.post('/signup', asyncHandler(signupUser));
router.post('/auth/login', asyncHandler(loginUser));
router.post('/AddProduct', verifyToken, asyncHandler(AddProduct));
router.get('/getProducts', asyncHandler(getProducts));
router.get('/getMerchantProducts/:id', verifyToken, asyncHandler(getProductsByMerchantID))
router.put('/updateProduct/:id', verifyToken, asyncHandler(updateProduct));
router.delete('/deleteProduct/:id', verifyToken, asyncHandler(deleteProduct));
router.post('/saveWallet', verifyToken, asyncHandler(savewallet));
router.get('/getWallet/:id', verifyToken, asyncHandler(getWalletById));

export default router;
