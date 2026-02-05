"use client";

import { useEffect } from "react";
import axios from "axios";

const AuthInitializer = () => {
  useEffect(() => {
    const token = localStorage.getItem("merchantToken");
    if (token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    }
  }, []);

  return null; 
};

export default AuthInitializer;
