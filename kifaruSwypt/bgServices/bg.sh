#!/bin/bash

# Node.js packages to install
node_packages=(
    "@types/bcrypt"
    "@types/ejs"
    "@types/express"
    "@types/jsonwebtoken"
    "@types/node"
    "@types/nodemailer"
    "@types/uuid"
    "@types/node-cron"
    "bcrypt"
    "concurrently"
    "cors"
    "dotenv"
    "ejs"
    "express"
    "joi"
    "jsonwebtoken"
    "cloudinary"
    "mssql"
    "nodemailer"
    "nodemon"
    "types-joi"
    "uuid"
    "node-cron"
)

# Development Node.js packages to install
dev_node_packages=(
    "@types/cors"
    "@types/mssql"
)

# Install Node.js packages
npm install "${node_packages[@]}" --save
npm install "${dev_node_packages[@]}" --save-dev

echo "All Node.js packages installed successfully."

# To install using git bash
# cd direct to the folder and execute command 
# bash <name of your sh file eg install.sh>
# bash install.sh