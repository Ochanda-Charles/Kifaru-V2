import { sqlConfig } from '../config/sqlConfig';
import { Request, Response } from "express";
import { v4 } from 'uuid';
import { ExtendedUserRequest } from '../middlewares/VerifyToken';
import bcrypt from 'bcrypt'

// Module-scope helper — uses SELECT 1 LIMIT 1 which is more efficient than COUNT(*)
const checkIfEmailExists = async (email: string): Promise<boolean> => {
  const result = await sqlConfig.query(
    'SELECT 1 FROM merchants WHERE email = $1 LIMIT 1',
    [email]
  );
  return (result.rowCount ?? 0) > 0;
};

//...............signUp user.......................
export const signupUser = async (req: Request, res: Response) => {
  try {

    const { merchantUserName, merchantEmail, password } = req.body;
    console.log("Signup attempt for email:", merchantEmail);

    if (!password) {
      return res.status(400).json({
        error: "Password is required"
      });
    }

    // Check email existence BEFORE the expensive bcrypt hash
    const emailExists = await checkIfEmailExists(merchantEmail);
    if (emailExists) {
      console.log("Email already exists:", merchantEmail);
      return res.status(400).json({
        error: 'Email is already registered',
      });
    }

    const id = v4();
    const hashPwd = await bcrypt.hash(password, 10);

    const query = `
      INSERT INTO merchants (merchant_id, username, email, password_hash)
      VALUES ($1, $2, $3, $4)
    `;
    const values = [id, merchantUserName, merchantEmail, hashPwd];

    const result = await sqlConfig.query(query, values);

    if ((result.rowCount ?? 0) > 0) {
      return res.status(201).json({
        message: "Account created successfully",
      });
    } else {
      return res.status(500).json({ error: "An error occurred while creating the account." });
    }
  } catch (error) {
    console.error("Error creating user:", error);
    return res.status(500).json({ error: "The user account was not created." });
  }
};

// ..................createProduct............................

export const AddProduct = async (req: ExtendedUserRequest, res: Response) => {
  try {
    const { name, description, imageUrl, price, quantity, walletAddressed, category_id, supplier_id } = req.body;
    const merchant_id = req.info?.merchant_id;

    if (!merchant_id) {
      return res.status(401).json({ error: "Unauthorized: Merchant ID not found in token." });
    }

    const id = v4();

    const data = await sqlConfig.query(
      `INSERT INTO Products (id, merchant_id, imageUrl, name, description, quantity, price, walletAddressed, category_id, supplier_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [id, merchant_id, imageUrl, name, description, quantity, price, walletAddressed, category_id, supplier_id]
    );

    return res.status(200).json({ message: 'Product created successfully', rowsAffected: data.rowCount });
  } catch (error) {
    console.error('Error creating Product:', error);
    return res.status(500).json({ error: 'An error occurred while creating the product.' });
  }
};

//...............get Products...........................
export const getProducts = async (req: Request, res: Response) => {
  try {
    const result = await sqlConfig.query(
      `SELECT p.*, m.wallet_address AS merchant_wallet
       FROM Products p
       LEFT JOIN merchants m ON p.merchant_id = m.merchant_id`
    );
    return res.json({
      message: result.rows
    });
  } catch (error) {
    console.error("error can't get from the Table Product:", error);
    res.status(500).send('Server Error');
  }
};


export const getProductsByMerchantID = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ message: "Merchant ID is required." });
    }

    const query = `
      SELECT p.*, c.name as category_name, s.name as supplier_name 
      FROM Products p
      LEFT JOIN Categories c ON p.category_id = c.id
      LEFT JOIN Suppliers s ON p.supplier_id = s.id
      WHERE p.merchant_id = $1
    `;
    const values = [id];
    const result = await sqlConfig.query(query, values);

    return res.status(200).json({
      message: "Products retrieved successfully.",
      data: result.rows,
    });

  } catch (error) {
    console.error("Error getting your products:", error);
    return res.status(500).json({ error: "An error occurred while retrieving products." });
  }
};


//...............update Product by id...........................
// Uses ExtendedUserRequest so merchant_id from the verified JWT can be used in the WHERE clause,
// preventing one merchant from updating another merchant's product (IDOR).
export const updateProduct = async (req: ExtendedUserRequest, res: Response) => {
  try {
    const { id } = req.params;
    const merchant_id = req.info?.merchant_id;
    const { name, description, imageUrl, price, category_id, supplier_id, quantity } = req.body;

    if (!merchant_id) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const result = await sqlConfig.query(
      `UPDATE Products SET name = $1, description = $2, imageUrl = $3, price = $4, category_id = $5, supplier_id = $6, quantity = $7 WHERE id = $8 AND merchant_id = $9`,
      [name, description, imageUrl, price, category_id, supplier_id, quantity, id, merchant_id]
    );

    if ((result.rowCount ?? 0) > 0) {
      return res.json({
        message: "Product updated successfully"
      });
    } else {
      return res.status(404).json({
        error: "Product not found"
      });
    }
  } catch (error) {
    console.error("Error updating product:", error);
    return res.status(500).json({ error: "An error occurred while updating the product." });
  }
};

//...............delete Product by id...........................
// Uses ExtendedUserRequest so merchant_id from the verified JWT can be used in the WHERE clause,
// preventing one merchant from deleting another merchant's product (IDOR).
export const deleteProduct = async (req: ExtendedUserRequest, res: Response) => {
  try {
    const { id } = req.params;
    const merchant_id = req.info?.merchant_id;

    if (!merchant_id) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const result = await sqlConfig.query(
      'DELETE FROM Products WHERE id = $1 AND merchant_id = $2',
      [id, merchant_id]
    );
    if ((result.rowCount ?? 0) > 0) {
      return res.json({
        message: "Product deleted successfully"
      });
    } else {
      return res.status(404).json({
        error: "Product not found"
      });
    }
  } catch (error) {
    console.error("Error deleting product:", error);
    return res.status(500).json({ error: "An error occurred while deleting the product." });
  }
};


// export const savewallet = async (req: Request, res: Response) => {
//   try {
//     const { merchant_id, wallet_address } = req.body;
//     const id = v4();

//     // Validate required fields
//     if (!merchant_id || !wallet_address) {
//       return res.status(400).json({ message: "merchant_id and wallet_address are required." });
//     }

//     // Insert into the wallets table
//     const query = `
//       INSERT INTO wallets (id, merchant_id, wallet_address)
//       VALUES ($1, $2, $3)
//       RETURNING *;
//     `;

//     const values = [id, merchant_id, wallet_address];
//     const result = await sqlConfig.query(query, values);

//     return res.status(201).json({
//       message: "Wallet saved successfully.",
//       data: result.rows[0],
//     });

//   } catch (error) {
//     console.error("Error saving wallet:", error);
//     return res.status(500).json({ message: "Internal server error." });
//   }
// };

export const savewallet = async (req: Request, res: Response) => {
  try {
    const { merchant_id, wallet_address } = req.body;
    const id = v4();

    if (!merchant_id || !wallet_address) {
      return res.status(400).json({ message: "merchant_id and wallet_address are required." });
    }

    const updateQuery = `
      UPDATE merchants 
      SET wallet_address = $1 
      WHERE merchant_id = $2
      RETURNING wallet_address;
    `;
    const values = [wallet_address, merchant_id];
    const result = await sqlConfig.query(updateQuery, values);

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Merchant not found." });
    }

    return res.status(200).json({
      message: "Wallet saved successfully.",
      data: result.rows[0],
    });

  } catch (error) {
    console.error("Error saving wallet:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};


export const getWalletById = async (req: Request, res: Response) => {
  const { id } = req.params;

  console.log("merchant_id param:", id);

  try {
    const result = await sqlConfig.query(
      "SELECT wallet_address FROM merchants WHERE merchant_id = $1",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Wallet not found" });
    }

    return res.status(200).json({
      wallet_address: result.rows[0].wallet_address
    });

  } catch (error) {
    console.error("Error fetching wallet:", error);
    return res.status(500).json({ message: "Server error" });
  }
};


